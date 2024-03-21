/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    forumAPI.ts
    API endpoint routes for managing users and profiles.
*/
import { Router, Request, Response, NextFunction } from 'express';
import dataStorage from "./Database.js";
import { UserData, ForumUser } from "./TypeDefs.js";
import { isLoggedIn, isOwner, isAdmin } from "./permissions.js";



// Router for the /api/user path endpoints 
const userAPI = Router();


// Get a list of all registered users. 
userAPI.get('/list', isLoggedIn, (req: Request, res: Response) => {
    console.log("TODO: Users list");
    res.json({ message: `TODO: Users list` });
});

userAPI.get('/current', (req: Request, res: Response) => {
    console.log("REQ USER", req.user, req.isAuthenticated());
    if (req.user) {
        const sessionUser = req.user as ForumUser;
        const currentUser: UserData = {
            id: sessionUser.id,
            name: sessionUser.name,
            email: sessionUser.email,
            picture: sessionUser.picture,
            admin: sessionUser.admin
        }

        res.json({ message: `User`, data: currentUser });
    }
    else {
        res.json({ message: "No User" });
    }
});


// POST target of form to register a new user account.
userAPI.post("/register", (req: Request, res: Response) => {
    try {
        const newUser = dataStorage.addUser(req.body.username, req.body.password, req.body.email);
        if (newUser) {
            const newUserData: UserData = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                picture: newUser.picture,
                admin: false
            }
            res.status(201);
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