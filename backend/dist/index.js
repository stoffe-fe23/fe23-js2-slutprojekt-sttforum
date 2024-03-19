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
const app = express();
app.use(express.json());
app.use(cors());
// Serve images and other static files in the "media" folder at the root path: http://localhost:3000/media
app.use('/media', express.static('media'));
// Serve the forum API endpoints at the path:  http://localhost:3000/api/forum
app.use('/api/forum', forumAPI);
// Serve the forum API endpoints at the path:  http://localhost:3000/api/user
app.use('/api/user', userAPI);
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
