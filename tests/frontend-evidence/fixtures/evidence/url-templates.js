/* URL templates — supporting only, never structured_operation */
function connectDiscord(x){location.href=`/api/connect/${x}`;}
function discordV2(q){return `/api/v2/connect/discord?${q}`;}
function cmsDownload(qs){return `/api/cms/v3/subscribers/download?${qs}`;}
