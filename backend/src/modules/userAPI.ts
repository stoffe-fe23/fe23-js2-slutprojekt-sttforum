/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    forumAPI.ts
    API endpoint routes for managing users and profiles.
*/
import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import multer from "multer";
import { sendClientUpdate, closeClientSocket } from "./server.js";
import dataStorage from "./Database.js";
import { UserData, ForumUser, ForumMessageContext } from "./TypeDefs.js";
import { isLoggedIn, isOwner, isAdmin, isCurrentUser } from "./permissions.js";
import {
    validationErrorHandler,
    validFileTypes,
    validateUserProfile,
    fileErrorHandler,
    validateUserRegister,
    validateUserId,
    validateProfileUserId,
    defaultPictureNames
} from "./validation.js";


// Router for the /api/user path endpoints 
const userAPI = Router();
const userPictureUpload = configureFileUpload();

const POST_HISTORY_MAX = 5;





//////////////////////////////////////////////////////////////////////////////////////////////
// Get a list of all registered users. 
userAPI.get('/list', isLoggedIn, (req: Request, res: Response) => {
    const userList = dataStorage.getUserList();
    if (userList) {
        console.log("DEBUG: Users list");
        res.json({ message: `User list`, data: userList });
    }
    else {
        res.json({ message: `User list`, data: [] });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Get the public profile of the specified user with their most recent posts.
userAPI.get('/profile/:userId', isLoggedIn, validateProfileUserId, validationErrorHandler, (req: Request, res: Response) => {
    if (req.params && req.params.userId) {
        const userProfile = dataStorage.getPublicUserProfile(req.params.userId);
        if (userProfile) {
            userProfile.recentPosts.sort((a, b) => b.date - a.date);
            userProfile.recentPosts = userProfile.recentPosts.slice(0, Math.min(userProfile.recentPosts.length, POST_HISTORY_MAX));

            res.json({ message: `User profile`, data: userProfile });
        }
        else {
            res.status(404);
            res.json({ error: `User not found.`, data: req.params.userId });
        }
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
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
        res.json({ message: "No User", data: {} });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// POST target of form to register a new user account.
userAPI.post("/register", validateUserRegister, validationErrorHandler, (req: Request, res: Response) => {
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


//////////////////////////////////////////////////////////////////////////////////////////////
// POST target of form to update user profile.   
userAPI.post("/profile/update", isLoggedIn, userPictureUpload.single('picture'), validateUserProfile, validationErrorHandler, fileErrorHandler, (req: Request, res: Response) => {
    try {
        if (req.user && (req.user as ForumUser).id) {
            if (!req.body.password.length || (req.body.password && req.body['password-confirm'] && (req.body.password.length > 3) && (req.body.password == req.body['password-confirm']))) {

                // Set one of the default images, or a user uploaded image if any. 
                let pictureName = req.file ? req.file.filename ?? "" : "";
                if (!req.file || !req.file.filename.length) {
                    if (defaultPictureNames.includes(req.body.defaultPicture)) {
                        pictureName = req.body.defaultPicture;
                    }
                    else if ((req.body.defaultPicture == "custom") && defaultPictureNames.includes((req.user as ForumUser).picture)) {
                        pictureName = "user-icon.png";
                    }
                }

                const userObj = dataStorage.editUser((req.user as ForumUser).id, req.body.username, req.body.password, req.body.email, pictureName);
                if (userObj) {
                    const userProfileData: UserData = {
                        id: userObj.id,
                        name: userObj.name,
                        email: userObj.email,
                        picture: userObj.picture,
                        admin: userObj.admin
                    }
                    dataStorage.updateAuthorInfo(userObj.id);
                    sendClientUpdate({ action: "edit", type: "user", data: userProfileData }, req);
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

//////////////////////////////////////////////////////////////////////////////////////////////
// Delete the specified user from the system.
userAPI.delete('/delete/:userId', isCurrentUser, validateUserId, validationErrorHandler, (req: Request, res: Response) => {
    if (req.params && req.params.userId) {
        let responseSent: boolean = false;
        const userId = req.params.userId;
        const currentUser = req.user as ForumUser;

        console.log("DELETE ACCOUNT", userId);

        // Soft-delete all posts made by this user.
        dataStorage.deletePostsByUser(userId);

        // Log off the user if they are currently logged on (i.e. it is not an admin deleting the user). 
        if (currentUser && (currentUser.id == userId)) {
            console.log("LOG OFF DELETED USER", userId);
            req.logout((error) => {
                closeClientSocket(userId);
                if (error) {
                    responseSent = true;
                    res.status(500);
                    res.json({ error: `Error logging out deleted user.`, data: userId });
                }
            });
        }

        // Remove the user from the DB
        if (dataStorage.deleteUser(userId)) {
            console.log("DELETE USER", userId);
            sendClientUpdate({ action: "delete", type: "user", data: { id: userId } }, req);
            if (!responseSent) {
                responseSent = true;
                res.json({ message: `User deleted`, data: userId });
            }
        }
        else {
            if (!responseSent) {
                responseSent = true;
                res.status(404);
                res.json({ error: `User not found.`, data: userId });
            }
        }

    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Configure the multer module to handle uploading profile pictures. 
// TODO: Use a proper validation library to prevent tampering with mime data to upload anything:
//       https://www.npmjs.com/package/validate-image-type
function configureFileUpload() {
    // Setup for upload of user profile pictures
    let pictureStorage = multer.diskStorage({
        destination: function (req, file, returnCallback) {
            returnCallback(null, '../backend/media/userpictures/');
        },
        filename: function (req, file, returnCallback) {
            // Set name of uploaded picture to <UserId>.<file extension>, i.e. f9258ea6-89c5-46b6-8577-9df9c343dc96.png
            let extension: string = (Object.keys(validFileTypes).includes(file.mimetype) ? validFileTypes[file.mimetype] : '');
            if (req.user && (req.user as ForumUser).id) {
                console.log("Multer Filename", file, req.user);
                const userId = (req.user as ForumUser).id;
                returnCallback(null, userId + extension);
            }
        }
    });

    return multer({
        storage: pictureStorage,
        fileFilter: function (req, file, returnCallback) {
            // Only allow JPG, PNG, GIF and WEPB files to be uploaded.
            if (!Object.keys(validFileTypes).includes(file.mimetype)) {
                return returnCallback(new Error('The profile picture must be in JPG, PNG, GIF or WEBP format.'));
            }
            returnCallback(null, true);
        },
        limits: {
            fileSize: 512 * 512
        }
    });
}


export default userAPI;