/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    forumAPI.ts
    API endpoint routes for managing users and profiles.
*/
import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import multer from "multer";
import dataStorage from "./Database.js";
import { UserData, ForumUser } from "./TypeDefs.js";
import { isLoggedIn, isOwner, isAdmin } from "./permissions.js";
import {
    validationErrorHandler,
    validFileTypes,
    validateUserProfile,
    fileErrorHandler
} from "./validation.js";


// Router for the /api/user path endpoints 
const userAPI = Router();

// Setup for upload of user profile pictures
let pictureStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../backend/media/userpictures/');
    },
    filename: function (req, file, cb) {
        let extension: string = (Object.keys(validFileTypes).includes(file.mimetype) ? validFileTypes[file.mimetype] : '');
        if (req.user && (req.user as ForumUser).id) {
            console.log("Multer Filename", file, req.user);
            const userId = (req.user as ForumUser).id;
            cb(null, userId + extension);
        }
    }
});
const userPictureUpload = multer({
    storage: pictureStorage,
    fileFilter: function (req, file, cb) {
        if (!Object.keys(validFileTypes).includes(file.mimetype)) {
            return cb(new Error('The profile picture must be in JPG, PNG, GIF or WEBP format.'));
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

// Get info about the currently logged in user visiting this route. 
// Response message is either "User" if data was found, or "No User"
// if the visitor is not logged in. 
userAPI.get('/current', (req: Request, res: Response) => {
    if (req.user && req.isAuthenticated()) {
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


// POST target of form to update user profile.   
userAPI.post("/profile/update", isLoggedIn, userPictureUpload.single('picture'), validateUserProfile, validationErrorHandler, fileErrorHandler, (req: Request, res: Response) => {
    try {
        if (req.user && (req.user as ForumUser).id) {
            if (!req.body.password.length || (req.body.password && req.body['password-confirm'] && (req.body.password.length > 3) && (req.body.password == req.body['password-confirm']))) {
                if (!req.file) {
                    console.log("DEBUG: No profile picture submitted!");
                }
                const userObj = dataStorage.editUser((req.user as ForumUser).id, req.body.username, req.body.password, req.body.email, req.file ? req.file.filename ?? "" : "");
                if (userObj) {
                    dataStorage.updateAuthorInfo(userObj.id);
                }
                res.status(200);
                res.json({ message: `User profile updated.`, data: userObj });
            }
        }
        else {
            res.status(404);
            res.json({ error: "Error updating user profile. User not found" });
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: "Error trying to save user profile. " + error.message });
    }
});


export default userAPI;