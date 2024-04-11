/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    server.ts
    Initialize the express and websocket servers. Manage websockets. 
*/
import express from "express";
import { Request, Response, NextFunction } from 'express';
import { WebSocket } from "ws";
import expressWs from 'express-ws';
import { SocketNotificationData, UserWebSocket } from "./TypeDefs.js";


// Create Express and Websocket servers. 
const { app, getWss, applyTo } = expressWs(express());


///////////////////////////////////////////////////////////////////////////////////
// Send a notification that something has changed to all connected clients. 
function sendClientUpdate(data: SocketNotificationData, req: Request): void {
    try {
        const srv = getWss();
        if (srv) {
            const sendData = JSON.stringify(data);
            srv.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(sendData);
                }
            });
        }
    }
    catch (error) {
        console.log("Socket message error: ", error);
    }
}


///////////////////////////////////////////////////////////////////////////////////
// Disconnect websocket connections by the specified user.
// If a session ID is given only connections related to that session will be closed. 
export function closeClientSocket(userId: string, sessionId: string = ""): void {
    try {
        const srv = getWss();
        if (srv) {
            srv.clients.forEach((client) => {
                if ((client.readyState === WebSocket.OPEN) || (client.readyState === WebSocket.CONNECTING)) {
                    if ((client as UserWebSocket).userId && userId.length && ((client as UserWebSocket).userId == userId)) {
                        if (!sessionId.length || ((client as UserWebSocket).sessionId == sessionId)) {
                            console.log("Closing client socket for ", (client as UserWebSocket).userId);
                            client.close();
                        }
                    }

                }
            });
        }
    }
    catch (error) {
        console.log("Close socket error: ", error);
    }
}


export { app, getWss, applyTo, sendClientUpdate };