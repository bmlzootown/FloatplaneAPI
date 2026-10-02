const STORAGE_KEYS = {
	token: "fpExplorer.accessToken",
	cookie: "fpExplorer.sailsSid",
	baseUrl: "fpExplorer.baseUrl",
	userAgent: "fpExplorer.userAgent",
};

const SPEC_CANDIDATES = [
	"./spec.json",
	"./floatplane-openapi-specification-trimmed.json",
	"../../src/floatplane-openapi-specification-trimmed.json",
	"../floatplane-openapi-specification-trimmed.json",
];

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

const state = {
	spec: null,
	operations: [],
	activeTags: new Set(),
	selectedId: null,
	query: "",
};

const els = {
	status: document.getElementById("spec-status"),
	search: document.getElementById("search"),
	tagFilters: document.getElementById("tag-filters"),
	list: document.getElementById("endpoint-list"),
	empty: document.getElementById("empty-detail"),
	detail: document.getElementById("detail"),
	method: document.getElementById("detail-method"),
	path: document.getElementById("detail-path"),
	summary: document.getElementById("detail-summary"),
	tags: document.getElementById("detail-tags"),
	description: document.getElementById("detail-description"),
	pathParams: document.getElementById("path-params"),
	queryParams: document.getElementById("query-params"),
	headerParams: document.getElementById("header-params"),
	bodyField: document.getElementById("body-field"),
	requestBody: document.getElementById("request-body"),
	tryForm: document.getElementById("try-form"),
	copyCurl: document.getElementById("copy-curl"),
	examplePanel: document.getElementById("example-panel"),
	exampleNote: document.getElementById("example-note"),
	exampleBody: document.getElementById("example-body"),
	responsePanel: document.getElementById("response-panel"),
	responseMeta: document.getElementById("response-meta"),
	responseBody: document.getElementById("response-body"),
	authToken: document.getElementById("auth-token"),
	authCookie: document.getElementById("auth-cookie"),
	baseUrl: document.getElementById("base-url"),
	userAgent: document.getElementById("user-agent"),
	toggleToken: document.getElementById("toggle-token-vis"),
	toggleCookie: document.getElementById("toggle-cookie-vis"),
	clearAuth: document.getElementById("clear-auth"),
};

function toast(message) {
	const existing = document.querySelector(".toast");
	if (existing) existing.remove();
	const node = document.createElement("div");
	node.className = "toast";
	node.textContent = message;
	document.body.appendChild(node);
	setTimeout(() => node.remove(), 2200);
}

async function loadSpec() {
	const errors = [];
	for (const url of SPEC_CANDIDATES) {
		try {
			const res = await fetch(url, { cache: "no-store" });
			if (!res.ok) {
				errors.push(`${url} → HTTP ${res.status}`);
				continue;
			}
			const json = await res.json();
			return { json, url };
		} catch (err) {
			errors.push(`${url} → ${err.message}`);
		}
	}
	throw new Error(`Could not load trimmed OpenAPI.\n${errors.join("\n")}\n\nRun: make docs-explorer`);
}

function resolveRef(spec, node) {
	if (!node || typeof node !== "object") return node;
	if (!node.$ref) return node;
	const ref = node.$ref;
	if (!ref.startsWith("#/")) return node;
	const parts = ref.slice(2).split("/");
	let cur = spec;
	for (const part of parts) {
		cur = cur?.[part];
		if (cur === undefined) return node;
	}
	return cur;
}

function deepResolve(spec, node, seen = new Set()) {
	const resolved = resolveRef(spec, node);
	if (!resolved || typeof resolved !== "object") return resolved;
	if (resolved.$ref) {
		const key = resolved.$ref;
		if (seen.has(key)) return { $ref: key };
		seen.add(key);
		return deepResolve(spec, resolveRef(spec, resolved), seen);
	}
	if (Array.isArray(resolved)) {
		return resolved.map((item) => deepResolve(spec, item, seen));
	}
	const out = {};
	for (const [k, v] of Object.entries(resolved)) {
		out[k] = deepResolve(spec, v, seen);
	}
	return out;
}

function exampleFromSchema(schema, spec, depth = 0) {
	if (!schema || depth > 6) return null;
	const s = resolveRef(spec, schema);
	if (!s || typeof s !== "object") return null;
	if (s.example !== undefined) return s.example;
	if (s.default !== undefined) return s.default;
	if (s.enum?.length) return s.enum[0];

	if (s.allOf?.length) {
		const merged = {};
		for (const part of s.allOf) {
			const ex = exampleFromSchema(part, spec, depth + 1);
			if (ex && typeof ex === "object" && !Array.isArray(ex)) Object.assign(merged, ex);
		}
		return Object.keys(merged).length ? merged : null;
	}

	switch (s.type) {
		case "object": {
			const obj = {};
			for (const [key, prop] of Object.entries(s.properties || {})) {
				obj[key] = exampleFromSchema(prop, spec, depth + 1);
			}
			return obj;
		}
		case "array":
			return [exampleFromSchema(s.items, spec, depth + 1)];
		case "integer":
		case "number":
			return 0;
		case "boolean":
			return false;
		case "string":
			if (s.format === "date-time") return "2020-01-01T00:00:00.000Z";
			if (s.format === "date") return "2020-01-01";
			return "";
		default:
			if (s.properties) return exampleFromSchema({ ...s, type: "object" }, spec, depth);
			return null;
	}
}

/**
 * Prefer media-type `example`, else first named `examples.*.value`.
 * Does not synthesize from schema — offline panel shows only documented examples.
 */
function responseExampleFromOperation(op, spec) {
	const responses = resolveRef(spec, op.operation.responses) || {};
	const preferred = ["200", "201", "202", "204"];
	const codes = [
		...preferred.filter((c) => responses[c]),
		...Object.keys(responses).filter((c) => !preferred.includes(c) && c !== "default"),
	];
	for (const code of codes) {
		const resp = resolveRef(spec, responses[code]);
		const content = resp?.content || {};
		const media =
			content["application/json"] ||
			content["application/json; charset=utf-8"] ||
			Object.values(content)[0];
		if (!media) continue;
		const resolved = resolveRef(spec, media);
		if (resolved?.example !== undefined) {
			return { status: code, source: "example", value: resolved.example };
		}
		const named = resolved?.examples;
		if (named && typeof named === "object") {
			for (const [name, entry] of Object.entries(named)) {
				const ex = resolveRef(spec, entry);
				if (ex && ex.value !== undefined) {
					return {
						status: code,
						source: `examples.${name}`,
						summary: ex.summary || name,
						value: ex.value,
					};
				}
			}
		}
	}
	return null;
}

function renderResponseExample(op) {
	if (!els.examplePanel) return;
	const found = responseExampleFromOperation(op, state.spec);
	if (!found) {
		els.examplePanel.hidden = true;
		els.exampleBody.textContent = "";
		return;
	}
	els.examplePanel.hidden = false;
	const bits = [`HTTP ${found.status}`, found.source];
	if (found.summary) bits.push(found.summary);
	els.exampleNote.textContent = `OpenAPI ${bits.join(" · ")} (offline; not a live request).`;
	els.exampleBody.textContent =
		typeof found.value === "string" ? found.value : JSON.stringify(found.value, null, 2);
}

function collectParameters(pathItem, operation) {
	const merged = new Map();
	for (const p of pathItem.parameters || []) {
		const resolved = resolveRef(state.spec, p);
		merged.set(`${resolved.in}:${resolved.name}`, resolved);
	}
	for (const p of operation.parameters || []) {
		const resolved = resolveRef(state.spec, p);
		merged.set(`${resolved.in}:${resolved.name}`, resolved);
	}
	return [...merged.values()];
}

function buildOperations(spec) {
	const ops = [];
	for (const [path, pathItem] of Object.entries(spec.paths || {})) {
		for (const method of HTTP_METHODS) {
			const operation = pathItem[method];
			if (!operation) continue;
			const tags = operation.tags?.length ? operation.tags : ["Untagged"];
			ops.push({
				id: `${method}:${path}`,
				method,
				path,
				summary: operation.summary || "",
				description: operation.description || "",
				tags,
				operation,
				pathItem,
				parameters: collectParameters(pathItem, operation),
				security: operation.security !== undefined ? operation.security : spec.security,
			});
		}
	}
	ops.sort((a, b) => {
		const tagA = a.tags[0] || "";
		const tagB = b.tags[0] || "";
		if (tagA !== tagB) return tagA.localeCompare(tagB);
		if (a.path !== b.path) return a.path.localeCompare(b.path);
		return a.method.localeCompare(b.method);
	});
	return ops;
}

/** True when the OpenAPI op is not explicitly public (security: []). */
function needsAuth(op) {
	if (!op.security) return true;
	if (Array.isArray(op.security) && op.security.length === 0) return false;
	return true;
}

function authLabel(op) {
	if (!needsAuth(op)) return "no auth required (OpenAPI)";
	// Explorer uses Bearer for REST; OpenAPI may still list only CookieAuth.
	return "Bearer (Keycloak) · OpenAPI still lists CookieAuth";
}

function filteredOperations() {
	const q = state.query.trim().toLowerCase();
	return state.operations.filter((op) => {
		if (state.activeTags.size && !op.tags.some((t) => state.activeTags.has(t))) {
			return false;
		}
		if (!q) return true;
		const hay = [op.method, op.path, op.summary, op.description, ...op.tags].join(" ").toLowerCase();
		return hay.includes(q);
	});
}

function renderTags() {
	const counts = new Map();
	for (const op of state.operations) {
		for (const tag of op.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
	}

	els.tagFilters.innerHTML = "";
	const allBtn = document.createElement("button");
	allBtn.type = "button";
	allBtn.className = "tag-chip";
	allBtn.textContent = `All (${state.operations.length})`;
	allBtn.setAttribute("aria-pressed", state.activeTags.size === 0 ? "true" : "false");
	allBtn.addEventListener("click", () => {
		state.activeTags.clear();
		renderTags();
		renderList();
	});
	els.tagFilters.appendChild(allBtn);

	for (const [tag, count] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "tag-chip";
		btn.textContent = `${tag} (${count})`;
		btn.setAttribute("aria-pressed", state.activeTags.has(tag) ? "true" : "false");
		btn.addEventListener("click", () => {
			if (state.activeTags.has(tag)) state.activeTags.delete(tag);
			else state.activeTags.add(tag);
			renderTags();
			renderList();
		});
		els.tagFilters.appendChild(btn);
	}
}

function renderList() {
	const ops = filteredOperations();
	els.list.innerHTML = "";
	if (!ops.length) {
		const empty = document.createElement("p");
		empty.className = "endpoint-summary";
		empty.textContent = "No endpoints match this filter.";
		els.list.appendChild(empty);
		return;
	}

	const groups = new Map();
	for (const op of ops) {
		const key = op.tags[0] || "Untagged";
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(op);
	}

	let delay = 0;
	for (const [tag, items] of groups) {
		const group = document.createElement("div");
		group.className = "tag-group";
		const title = document.createElement("h2");
		title.className = "tag-group-title";
		title.textContent = tag;
		group.appendChild(title);

		for (const op of items) {
			const row = document.createElement("button");
			row.type = "button";
			row.className = "endpoint-row";
			row.setAttribute("role", "option");
			row.setAttribute("aria-selected", op.id === state.selectedId ? "true" : "false");
			row.style.animationDelay = `${Math.min(delay, 12) * 0.03}s`;
			delay += 1;
			row.innerHTML = `
				<span class="method-badge ${op.method}">${op.method}</span>
				<span>
					<span class="endpoint-path">${escapeHtml(op.path)}</span>
					<span class="endpoint-summary">${escapeHtml(op.summary || "No summary")}</span>
				</span>
			`;
			row.addEventListener("click", () => selectOperation(op.id));
			group.appendChild(row);
		}
		els.list.appendChild(group);
	}
}

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function selectedOperation() {
	return state.operations.find((op) => op.id === state.selectedId) || null;
}

function renderParamBlock(container, title, params) {
	container.innerHTML = "";
	if (!params.length) return;
	const heading = document.createElement("h3");
	heading.textContent = title;
	container.appendChild(heading);
	const list = document.createElement("div");
	list.className = "param-list";

	for (const param of params) {
		const item = document.createElement("div");
		item.className = "param-item";
		const schema = resolveRef(state.spec, param.schema || {});
		const enumVals = schema?.enum ? schema.enum.join(" | ") : "";
		const inputId = `param-${param.in}-${param.name}`;
		const label = document.createElement("label");
		label.setAttribute("for", inputId);
		label.innerHTML = `<span class="name">${escapeHtml(param.name)}</span>`;
		const meta = document.createElement("div");
		meta.className = "param-meta";
		meta.innerHTML = `${param.required ? '<span class="required">required</span> · ' : ""}${escapeHtml(schema?.type || "string")}${enumVals ? ` · ${escapeHtml(enumVals)}` : ""}`;
		let control;
		if (schema?.enum?.length) {
			control = document.createElement("select");
			control.id = inputId;
			const blank = document.createElement("option");
			blank.value = "";
			blank.textContent = param.required ? "Select…" : "(omit)";
			control.appendChild(blank);
			for (const value of schema.enum) {
				const opt = document.createElement("option");
				opt.value = String(value);
				opt.textContent = String(value);
				control.appendChild(opt);
			}
		} else {
			control = document.createElement("input");
			control.id = inputId;
			control.type = "text";
			control.placeholder = schema?.example != null ? String(schema.example) : param.name;
		}
		control.dataset.paramIn = param.in;
		control.dataset.paramName = param.name;
		control.className = "param-control";
		const desc = document.createElement("div");
		desc.className = "param-desc";
		desc.textContent = param.description || "";
		item.append(label, meta, control, desc);
		list.appendChild(item);
	}
	container.appendChild(list);
}

function selectOperation(id) {
	state.selectedId = id;
	const op = selectedOperation();
	renderList();
	if (!op) {
		els.empty.hidden = false;
		els.detail.hidden = true;
		return;
	}

	els.empty.hidden = true;
	els.detail.hidden = false;
	els.detail.classList.remove("detail");
	void els.detail.offsetWidth;
	els.detail.classList.add("detail");

	els.method.textContent = op.method;
	els.method.className = `method-badge ${op.method}`;
	els.path.textContent = op.path;
	els.summary.textContent = op.summary || "Untitled operation";
	els.tags.textContent = op.tags.join(" · ") + " · " + authLabel(op);
	els.description.textContent = op.description || "";

	renderParamBlock(els.pathParams, "Path parameters", op.parameters.filter((p) => p.in === "path"));
	renderParamBlock(els.queryParams, "Query parameters", op.parameters.filter((p) => p.in === "query"));
	renderParamBlock(els.headerParams, "Header parameters", op.parameters.filter((p) => p.in === "header"));

	const body = op.operation.requestBody;
	if (body) {
		els.bodyField.hidden = false;
		const content = resolveRef(state.spec, body)?.content?.["application/json"];
		const schema = content?.schema;
		const example = content?.example ?? exampleFromSchema(schema, state.spec);
		els.requestBody.value = example != null ? JSON.stringify(example, null, 2) : "{\n}\n";
	} else {
		els.bodyField.hidden = true;
		els.requestBody.value = "";
	}

	renderResponseExample(op);

	els.responsePanel.hidden = true;
	els.responseMeta.textContent = "";
	els.responseBody.textContent = "";

	if (id) {
		history.replaceState(null, "", `#${encodeURIComponent(id)}`);
	}
}

function readParamValues() {
	const values = { path: {}, query: {}, header: {} };
	for (const control of document.querySelectorAll(".param-control")) {
		const where = control.dataset.paramIn;
		const name = control.dataset.paramName;
		const raw = control.value;
		if (raw === "") continue;
		values[where][name] = raw;
	}
	return values;
}

function buildUrl(op) {
	const base = (els.baseUrl.value || "https://www.floatplane.com").replace(/\/$/, "");
	const values = readParamValues();
	let path = op.path;
	for (const [name, value] of Object.entries(values.path)) {
		path = path.replaceAll(`{${name}}`, encodeURIComponent(value));
	}
	const url = new URL(base + path);
	for (const [name, value] of Object.entries(values.query)) {
		url.searchParams.set(name, value);
	}
	return { url, values };
}

function buildCurl(op) {
	const { url, values } = buildUrl(op);
	const lines = [`curl -X ${op.method.toUpperCase()} '${url.toString()}'`];
	const ua = els.userAgent.value.trim();
	if (ua) lines.push(`  -H 'User-Agent: ${ua.replaceAll("'", "'\\''")}'`);
	for (const [name, value] of Object.entries(values.header)) {
		lines.push(`  -H '${name}: ${value.replaceAll("'", "'\\''")}'`);
	}
	const token = els.authToken.value.trim();
	if (token && needsAuth(op)) {
		lines.push(`  -H 'Authorization: Bearer ${token.replaceAll("'", "'\\''")}'`);
	}
	if (!els.bodyField.hidden && els.requestBody.value.trim()) {
		lines.push(`  -H 'Content-Type: application/json'`);
		const body = els.requestBody.value.trim().replaceAll("'", "'\\''");
		lines.push(`  --data-raw '${body}'`);
	}
	return lines.join(" \\\n");
}

async function sendRequest(op) {
	const { url, values } = buildUrl(op);
	const headers = new Headers();
	const ua = els.userAgent.value.trim();
	// Browsers forbid setting User-Agent; still attempt custom headers that are allowed.
	if (ua) headers.set("X-Floatplane-Explorer-UA", ua);
	for (const [name, value] of Object.entries(values.header)) {
		headers.set(name, value);
	}
	const token = els.authToken.value.trim();
	if (token && needsAuth(op)) {
		headers.set("Authorization", `Bearer ${token}`);
	}
	const init = {
		method: op.method.toUpperCase(),
		headers,
		credentials: "omit",
	};
	if (!els.bodyField.hidden && els.requestBody.value.trim()) {
		headers.set("Content-Type", "application/json");
		init.body = els.requestBody.value.trim();
	}

	const notes = [];
	const host = new URL(url).hostname;
	if (host.endsWith("floatplane.com")) {
		notes.push("Target is Floatplane. Live Send may fail with CORS from this origin.");
	}
	if (token && needsAuth(op)) {
		notes.push("Authorization: Bearer is attached for this request (modern REST / Keycloak access token).");
	} else if (needsAuth(op)) {
		notes.push("No Bearer token set — authenticated REST calls will likely fail.");
	}
	notes.push("sails.sid cookie is chat/Socket.IO-only and is not sent with Explorer REST requests.");

	const started = performance.now();
	try {
		const res = await fetch(url, init);
		const elapsed = Math.round(performance.now() - started);
		const text = await res.text();
		let pretty = text;
		try {
			pretty = JSON.stringify(JSON.parse(text), null, 2);
		} catch {
			/* keep raw */
		}
		els.responsePanel.hidden = false;
		els.responseMeta.innerHTML = `
			<span>HTTP ${res.status} ${res.statusText || ""}</span>
			<span>${elapsed} ms</span>
			<span>${escapeHtml(res.headers.get("content-type") || "unknown content-type")}</span>
		`;
		els.responseBody.textContent = [notes.join("\n"), pretty].filter(Boolean).join("\n\n");
	} catch (err) {
		els.responsePanel.hidden = false;
		els.responseMeta.innerHTML = `<span style="color: var(--danger)">Request failed</span>`;
		els.responseBody.textContent = [
			notes.join("\n"),
			String(err && err.message ? err.message : err),
			"",
			"Likely CORS or network block. Use Copy curl with Authorization: Bearer …, or point Base URL at a local proxy.",
		].filter(Boolean).join("\n");
	}
}

function persistAuth() {
	localStorage.setItem(STORAGE_KEYS.token, els.authToken.value);
	localStorage.setItem(STORAGE_KEYS.cookie, els.authCookie.value);
	localStorage.setItem(STORAGE_KEYS.baseUrl, els.baseUrl.value);
	localStorage.setItem(STORAGE_KEYS.userAgent, els.userAgent.value);
}

function restoreAuth() {
	els.authToken.value = localStorage.getItem(STORAGE_KEYS.token) || "";
	els.authCookie.value = localStorage.getItem(STORAGE_KEYS.cookie) || "";
	els.baseUrl.value = localStorage.getItem(STORAGE_KEYS.baseUrl) || "https://www.floatplane.com";
	els.userAgent.value = localStorage.getItem(STORAGE_KEYS.userAgent) || "FloatplaneAPI-Explorer/1.0";
}

function wireEvents() {
	els.search.addEventListener("input", () => {
		state.query = els.search.value;
		renderList();
	});

	els.tryForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const op = selectedOperation();
		if (!op) return;
		await sendRequest(op);
	});

	els.copyCurl.addEventListener("click", async () => {
		const op = selectedOperation();
		if (!op) return;
		const curl = buildCurl(op);
		try {
			await navigator.clipboard.writeText(curl);
			toast("curl copied");
		} catch {
			window.prompt("Copy curl", curl);
		}
	});

	for (const input of [els.authToken, els.authCookie, els.baseUrl, els.userAgent]) {
		input.addEventListener("change", persistAuth);
		input.addEventListener("blur", persistAuth);
	}

	els.toggleToken.addEventListener("click", () => {
		const show = els.authToken.type === "password";
		els.authToken.type = show ? "text" : "password";
		els.toggleToken.setAttribute("aria-pressed", show ? "true" : "false");
		els.toggleToken.textContent = show ? "Hide token" : "Show token";
	});

	els.toggleCookie.addEventListener("click", () => {
		const show = els.authCookie.type === "password";
		els.authCookie.type = show ? "text" : "password";
		els.toggleCookie.setAttribute("aria-pressed", show ? "true" : "false");
		els.toggleCookie.textContent = show ? "Hide cookie" : "Show cookie";
	});

	els.clearAuth.addEventListener("click", () => {
		els.authToken.value = "";
		els.authCookie.value = "";
		localStorage.removeItem(STORAGE_KEYS.token);
		localStorage.removeItem(STORAGE_KEYS.cookie);
		toast("Local auth cleared");
	});
}

async function main() {
	restoreAuth();
	wireEvents();
	try {
		const { json, url } = await loadSpec();
		state.spec = json;
		state.operations = buildOperations(json);
		const version = json.info?.version || "unknown";
		els.status.textContent = `${state.operations.length} documented ops · OpenAPI ${json.openapi || "3"} · spec ${version} · loaded ${url}`;
		renderTags();
		renderList();
		const hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
		if (hash && state.operations.some((op) => op.id === hash)) {
			selectOperation(hash);
		} else if (state.operations[0]) {
			// Land on first documented op so the detail pane is never an empty void on first paint.
			selectOperation(state.operations[0].id);
		}
	} catch (err) {
		els.status.textContent = "Failed to load OpenAPI";
		els.list.innerHTML = `<pre class="response-body" style="max-height:none">${escapeHtml(String(err.message || err))}</pre>`;
	}
}

main();

window.addEventListener("hashchange", () => {
	const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
	if (hash && hash !== state.selectedId) selectOperation(hash);
});
