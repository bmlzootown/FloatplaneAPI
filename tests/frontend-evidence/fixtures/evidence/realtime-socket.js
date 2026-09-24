/* Realtime sails + chat config */
const cfg={frontend:"https://frontend.floatplane.com/user/x/",chat:{socket:{uri:"https://chat.floatplane.com",options:{reconnection:!0}}},auth:"https://auth.floatplane.com"};
const path=apiAuthStore.usesCookie?"/api/v3/socket/connect":"/api/v3/socket/tk/connect";
Nm.socket.post(path,{...apiAuthStore.socketParams},(o,a)=>{a.statusCode===200&&console.log("ok")});
/* Also as structured REST */
class SocketApi{async connectRaw(i){const e={},n={},u=await this.request({path:"/api/v3/socket/connect",method:"POST",headers:n,query:e},i);return new t.JSONApiResponse(u,c=>(0,r.ConnectResponseFromJSON)(c))}
async tkConnectRaw(i){const e={},n={},u=await this.request({path:"/api/v3/socket/tk/connect",method:"POST",headers:n,query:e},i);return new t.JSONApiResponse(u,c=>(0,r.ConnectResponseFromJSON)(c))}}
