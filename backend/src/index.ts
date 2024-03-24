/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    index.ts
    Main script for the Node.js/Express server. Set up served routes and listen for client connections. 
*/
import express from "express";
import { Request, Response, NextFunction } from 'express';
import cors from "cors";
import forumAPI from "./modules/forumAPI.js";
import userAPI from "./modules/userAPI.js";
import dataStorage from "./modules/Database.js";
import { sessionSetup, passport } from "./modules/authentication.js";
import { isLoggedIn, isAdmin } from "./modules/permissions.js";

const app = express();

// Note: Allow-Origin "*" will block fetch() calls on the client from sending cookies to server :(
// and req.headers.origin is sometimes undefined for some reason, so have to hardcode an origin
// for when that happens too, just in case, for testing... 
app.use(cors({
    origin: (origin, callback) => { callback(null, origin ?? 'http://localhost:1234'); },
    methods: 'GET,PUT,PATCH,POST,DELETE,OPTIONS,HEAD',
    allowedHeaders: 'Content-Type,X-Requested-With',
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


// Serve frontend files via node.
// NOTE! Having the client served this way causes the Navigo library on the client side to severely malfunction 
// for some reason, no longer allowing direct access to any route other than /, and breaking on page refresh. Why? 
// app.use(express.static('../frontend/docs'));


// Test route: user logged in with admin permissions
app.get("/test/:testid", (req: Request, res: Response) => {
    res.json({
        message: "Test!",
        method: req.method,
        origin: req.headers.origin ?? "Not set",
        host: req.headers.host ?? "Not set",
        referer: req.headers.referer ?? "Not set",
        body: req.body,
        params: req.params,
        path: req.path,
        url: req.url
    });
});
// Test route: user logged in
app.get("/protected", isLoggedIn, (req: Request, res: Response) => {
    console.log("HEADER", req.socket.remoteAddress);
    res.json({ message: "Authenticated!" });
});
// Test route: user logged in with admin permissions
app.get("/admin", isAdmin, (req: Request, res: Response) => {
    res.json({ message: "Administrator!" });
});


// General error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log("Server error:", err);
    res.status(500);
    res.json({ error: err.message });
})


// Start the server
app.listen(3000, () => {
    console.log('Server listening on port 3000: http://localhost:3000/');

    // Cache forum and user data from disk. 
    dataStorage.initialize();
})
