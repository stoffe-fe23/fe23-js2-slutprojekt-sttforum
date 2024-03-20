/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    forumAPI.ts
    API endpoints for managing users and profiles.
*/
import { Router } from "express";
import dataStorage from "./Database.js";
import { UserData } from "./TypeDefs.js";



// Router for the /api/user path endpoints 
const userAPI = Router();


userAPI.get('/list', (req, res) => {
    console.log("TODO: Users list");
    res.json({ message: `TODO: Users list` });
});


userAPI.post("/register", (req, res) => {
    try {
        const newUser = dataStorage.addUser(req.body.username, req.body.password, req.body.email);
        if (newUser) {
            const newUserData: UserData = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                picture: newUser.picture
            }
            res.json({ message: `New user added.`, data: newUserData });
        }
        else {
            res.status(400);
            res.json({ error: "Could not create new user." });
        }
    }
    catch (error) {
        res.status(400);
        res.json({ error: "Error trying to create new user. " + error.message });
    }
});


export default userAPI;