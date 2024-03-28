/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    index.ts
    Main script for the Node.js/Express server. Set up served routes and listen for client connections. 
*/
import express from "express";
import { Request, Response, NextFunction } from 'express';
import { app, getWss, applyTo, sendClientUpdate } from "./modules/server.js";
import cors from "cors";
import forumAPI from "./modules/forumAPI.js";
import userAPI from "./modules/userAPI.js";
import dataStorage from "./modules/Database.js";
import { sessionSetup, passport } from "./modules/authentication.js";
import { ForumUser, SocketNotificationData } from "./modules/TypeDefs.js";

/* class CustomWebSocket extends WebSocket {
    userId: string; // Your custom property (user ID)
  }

  declare module 'express' {
    interface Application {
      ws(route: string, handler: (ws: CustomWebSocket, req: Request) => void): void;
    }
  } 
 */

/* declare module "express-ws" {
    interface UserWebsocketRequestHandler extends WebsocketRequestHandler {
        userId: string
    }
} */

/* declare module 'express' {
    interface Application {
      ws(route: string, handler: (ws: WebSocket, req: Request) => void): void;
    }
  }

interface ExtWebSocket extends WebSocket {
    userId: string;
}
 */
/*
declare module 'express' {
  interface Application {
    ws(route: string, handler: (ws: WebSocket, req: Request) => void): void;
  }
}
*/


// import https from "https";
// import fs from "fs";
// import path from 'path';
// import { fileURLToPath } from 'url'

// const baseDirectory = path.dirname(fileURLToPath(import.meta.url));

/* const sslOptions = {
    key: fs.readFileSync("./ssl/localhost-key.pem"),
    cert: fs.readFileSync("./ssl/localhost.pem"),
};
 */
/* const app = express();
const socketServer = expressWs(app); */
// const { app, getWss, applyTo } = expressWs(express());


// Note: Allow-Origin "*" will block fetch() calls on the client from sending cookies to server :(
// and req.headers.origin is sometimes undefined for some reason, so have to hardcode an origin
// for when that happens too, just in case, for testing... 
app.use(cors({
    origin: (origin, callback) => { callback(null, origin ?? 'http://localhost:1234'); }, // 'https://localhost:3000'
    methods: 'GET,PUT,PATCH,POST,DELETE,OPTIONS,HEAD',
    allowedHeaders: 'Content-Type,X-Requested-With',
    credentials: true,
}));

// Serve images and other static files in the "media" folder at the root path: http://localhost:3000/media
// Note: This must be above the session handler or it will bug out when serving static files. 
app.use('/media', express.static('media'));


// Serve frontend files via node.
// NOTE! Having the client served this way causes the Navigo library on the client side to severely malfunction 
// for some reason, no longer allowing direct access to any route other than /, and breaking on page refresh.  
// Because apparently the node server will get the clientside routes, note that they do not exist on the server,
// and send back a 404 error message overwriting the index page.  :/
// Workaround to set up server to catch client side routes to serve the index.html page on those as well.
// But this will break stylesheet links etc in the index file since it is no longer just present in the server root. :/
// So may also need to use absolute URLS to stylesheet and script files in index.html if doing this.... 
/*
app.get('/*', function(req, res, next) {
    if (req.url.startsWith('/api') || req.url.startsWith('/media') || (TODO: exclude *.CSS and *.JS files as well) ) {
        return next();
    }
    // TODO: Serve the index.html page
    //       But since res.sendFile() refuses to serve anything from outside the server root this is also problematic,
    //       unless moving the frontend docs folder into the backend folder.... :(
  });
*/
// app.use(express.static('../frontend/docs'));



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


app.ws("/api/updates", (ws, req: Request) => {
    const userId = (req.user && (req.user as ForumUser).id ? (req.user as ForumUser).id : "0");

    // Setup connection. Close connection if it is not by an authenticated user. 
    if ((userId != "0") && req.isAuthenticated()) {
        (ws as any).userId = userId;
        console.log("SOCKET ESTABLISHED: ", (ws as any).userId);
    }
    else {
        const response: SocketNotificationData = {
            action: "error",
            type: "authentication",
            data: { status: 401, message: "Not Authorized" }
        }
        ws.send(JSON.stringify(response));
        ws.close();
        // console.log("SOCKET DENIED: Not authenticated.");
    }

    ws.on("close", (socket: WebSocket) => {
        console.log(`SOCKET CLOSED: `, (socket as any).userId ?? "No user ID");
    });

    ws.on("error", (error) => {
        console.log("SOCKET ERROR: ", error);
    });
});


// General error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log("Server error:", err);
    res.status(500);
    res.json({ error: err.message });
})


// Start the server
// const server = https.createServer(sslOptions, app);
// server.listen(3000, () => {
app.listen(3000, () => {
    console.log('Server listening on port 3000: http://localhost:3000/');

    // Cache forum and user data from disk storage files. 
    dataStorage.initialize();
})
