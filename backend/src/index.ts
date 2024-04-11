/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    index.ts
    Main script for the Node.js/Express server. Set up served routes and listen for client connections. 
*/
import express from "express";
import { Request, Response, NextFunction } from 'express';
import { app } from "./modules/server.js";
import * as ws from "ws";
import cors from "cors";
import forumAPI from "./modules/forumAPI.js";
import userAPI from "./modules/userAPI.js";
import dataStorage from "./modules/Database.js";
import { sessionSetup, passport } from "./modules/authentication.js";
import { ForumUser, SocketNotificationData, UserWebSocket } from "./modules/TypeDefs.js";


// Note: Allow-Origin "*" will block fetch() calls on the client from sending cookies to server
// and req.headers.origin is sometimes undefined for some reason, so have to hardcode an origin
// for when that happens too, just in case, for testing... 
app.use(cors({
    origin: (origin, callback) => { callback(null, origin ?? 'http://localhost:1234'); }, // 'https://localhost:3000'
    methods: 'GET,PUT,PATCH,POST,DELETE,OPTIONS,HEAD',
    allowedHeaders: 'Content-Type,X-Requested-With,Accept',
    credentials: true,
}));

// Serve images and other static files in the "media" folder at the root path: http://localhost:3000/media
// Note: This must be above the session handler or it will bug out when serving static files. 
app.use('/media', express.static('media'));

// Set up session and authentication middleware
app.use(sessionSetup);
app.use(passport.initialize());
app.use(passport.session());

// Set up request data parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the users API endpoints at the path:  http://localhost:3000/api/user
app.use('/api/user', userAPI);

// Serve the forum API endpoints at the path:  http://localhost:3000/api/forum
app.use('/api/forum', forumAPI);

// Route for establishing a websocket connection.
// Clients get live-notified of changes to posts/threads/users via this connection.
app.ws("/api/updates", (ws: ws.WebSocket, req: Request) => {
    const userId = (req.user && (req.user as ForumUser).id ? (req.user as ForumUser).id : "0");
    if ((userId != "0") && req.isAuthenticated()) {
        // Store associated user/session info on the socket.
        (ws as UserWebSocket).sessionId = req.session.id;
        (ws as UserWebSocket).userId = userId;
        console.log("Websocket connection established: ", (ws as UserWebSocket).userId, req.session.id);
    }
    else {
        // Close connection if it is not by an authenticated user. 
        const response: SocketNotificationData = {
            action: "error",
            type: "authentication",
            data: { status: 401, message: "Not Authorized" }
        }
        ws.send(JSON.stringify(response));
        ws.close();
    }

    ws.on("error", (error) => {
        console.log("Websocket error: ", error);
    });
});


// General error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (!res.headersSent) {
        res.status(500);
        res.json({ error: err.message });
    }
    else {
        console.log("Server error, headers already sent: ", err);
    }
})


// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000...');

    // Cache forum and user data from disk storage files. 
    dataStorage.initialize();
})
