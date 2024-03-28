import express from "express";
import { Request, Response, NextFunction } from 'express';
import { WebSocket } from "ws";
import expressWs from 'express-ws';
import { SocketNotificationData } from "./TypeDefs.js";

const { app, getWss, applyTo } = expressWs(express());

function sendClientUpdate(data: SocketNotificationData, req: Request): void {
    try {
        const srv = getWss();
        if (srv) {
            const sendData = JSON.stringify(data);
            srv.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(sendData);
                    console.log("CLIENT UPDATE: ", (client as any).userId ?? "No user id", sendData);
                }
            });
        }
    }
    catch (error) {
        console.log("SOCKETMSG ERROR", error);
    }
}

export function closeClientSocket(userId: string) {
    try {
        const srv = getWss();
        if (srv) {

            srv.clients.forEach((client) => {
                if ((client.readyState === WebSocket.OPEN) || (client.readyState === WebSocket.CONNECTING)) {
                    if ((client as any).userId && ((client as any).userId == userId)) {
                        console.log("Close socket connection: ", userId);
                        client.close();
                    }

                }
            });
        }
    }
    catch (error) {
        console.log("SOCKETMSG ERROR", error);
    }
}


export { app, getWss, applyTo, sendClientUpdate };