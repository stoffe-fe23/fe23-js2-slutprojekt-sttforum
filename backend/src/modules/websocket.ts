
let socketServer = null;

export default socketServer;


/* import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";

let socketServer : WebSocketServer;


interface UserWebSocket extends WebSocket {
    userId: string; 
}

export function createSocketServer(appServer : Server) : void {
    socketServer = new WebSocketServer({ server: appServer, path: "/api/updates" });

    // Persistent connection established. 
    socketServer.on("connection", (ws : UserWebSocket, req : Request) => {
        console.log("DEBUG: SOCKET CONNECTION: ", ws.);
        ws.userId = "0";
        console.log(`Websocket connection established! (${ws.userId})`);

        // Connection is closed
        ws.on("close", () => {
            console.log(`Websocket connection closed! (${ws.userId})`);
        });

        ws.on("error", (error) => {
            console.log("Websocket error (1)!", error);
        });

        ws.onerror = ((error) => {
            console.log("Websocket error (2)!", error);
        });

    });
} */