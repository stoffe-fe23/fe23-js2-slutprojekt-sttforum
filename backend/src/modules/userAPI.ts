/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    forumAPI.ts
    API endpoints for managing users and profiles.
*/
import { Router } from "express";
import dataStorage from "./Datastore.js";


// Router for the /api/user path endpoints 
const userAPI = Router();


userAPI.get('/list', (req, res) => {
    console.log("TODO: Users list");
    res.json({ message: `TODO: Users list` });
});



export default userAPI;