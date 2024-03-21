/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    forumAPI.ts
    API endpoint routes for managing users and profiles.
*/
import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import multer from "multer";
import dataStorage from "./Database.js";
import { UserData, ForumUser } from "./TypeDefs.js";
import { isLoggedIn, isOwner, isAdmin } from "./permissions.js";



// Router for the /api/user path endpoints 
const userAPI = Router();

const validFileTypes = { 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/png': '.png', 'image/webp': '.webp' };

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../backend/media/userpictures/')
    },
    filename: function (req, file, cb) {
        let extension: string = (Object.keys(validFileTypes).includes(file.mimetype) ? validFileTypes[file.mimetype] : '');
        if (req.user && (req.user as ForumUser).id) {
            const userId = (req.user as ForumUser).id;
            cb(null, userId + extension);
        }
        else {
            cb(null, Date.now() + extension);
        }
    }
});

const userPictureUpload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!Object.keys(validFileTypes).includes(file.mimetype)) {
            return cb(new Error('Only images are allowed'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 512 * 512
    }
});


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


userAPI.post("/profile/update", userPictureUpload.single('picture'), (req: Request, res: Response) => {
    // TODO: Update user profile.
    // req.file - the profile picture
    // req.body - other form fields
    console.log("TODO: Profile update", req.body, req.file);
});


export default userAPI;