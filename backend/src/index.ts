/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    index.ts
    Main script for the Node.js/Express server. Set up served resources and listen for client connections. 
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

// This will block fetch() from sending cookies :(
// app.use(cors());

// Have to hardcode it instead for now... unless there is a better solution.
app.use((req: Request, res: Response, next: NextFunction) => {
    res.set("Access-Control-Allow-Origin", req.headers.host);
    res.set("Access-Control-Allow-Credentials", "true");
    //     res.set("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
    res.set("Access-Control-Allow-Methods", "PUT,PATCH,POST,GET,DELETE,OPTIONS");
    next();
});

app.use(sessionSetup);
app.use(passport.initialize());
app.use(passport.session());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve images and other static files in the "media" folder at the root path: http://localhost:3000/media
app.use('/media', express.static('media'));

// Serve the forum API endpoints at the path:  http://localhost:3000/api/user
app.use('/api/user', userAPI);

// Serve the forum API endpoints at the path:  http://localhost:3000/api/forum
app.use('/api/forum', forumAPI);



app.use(express.static('../frontend/docs'));


// Test route: user logged in with admin permissions
app.get("/test/:testid", (req: Request, res: Response) => {
    res.json({ message: "Test!", method: req.method, badi: req.body, params: req.params, path: req.path, url: req.url });
});
// Test route: user logged in
app.get("/protected", isLoggedIn, (req: Request, res: Response) => {
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


app.listen(3000, () => {
    console.log('Server listening on port 3000: http://localhost:3000/');

    // Load forum and user data from disk. 
    dataStorage.initialize();
})
