/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    index.ts
    Main script for the Node.js/Express server. Set up served resources and listen for client connections.
*/
import express from "express";
import cors from "cors";
import forumAPI from "./modules/forumAPI.js";
import userAPI from "./modules/userAPI.js";
import dataStorage from "./modules/Database.js";
import { sessionSetup, passport } from "./modules/authentication.js";
import { isLoggedIn, isAdmin } from "./modules/permissions.js";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(sessionSetup);
app.use(passport.initialize());
app.use(passport.session());
// Serve images and other static files in the "media" folder at the root path: http://localhost:3000/media
app.use('/media', express.static('media'));
// Serve the forum API endpoints at the path:  http://localhost:3000/api/forum
app.use('/api/forum', forumAPI);
// Serve the forum API endpoints at the path:  http://localhost:3000/api/user
app.use('/api/user', userAPI);
// Test route: user logged in with admin permissions
app.get("/test/:testid", (req, res) => {
    res.json({ message: "Test!", method: req.method, badi: req.body, params: req.params, path: req.path, url: req.url });
});
// Test route: user logged in
app.get("/protected", isLoggedIn, (req, res) => {
    res.json({ message: "Authenticated!" });
});
// Test route: user logged in with admin permissions
app.get("/admin", isAdmin, (req, res) => {
    res.json({ message: "Administrator!" });
});
// General error handler
app.use((err, req, res, next) => {
    console.log("Server error:", err);
    res.status(500);
    res.json({ error: err.message });
});
app.listen(3000, () => {
    console.log('Server listening on port 3000: http://localhost:3000/');
    // Load forum and user data from disk. 
    dataStorage.initialize();
});
