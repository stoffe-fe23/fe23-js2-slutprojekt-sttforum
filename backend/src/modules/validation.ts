/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    validation.ts
    Middleware for validating client input to various routes. 
*/
import { body, param, check, validationResult } from "express-validator";
import { Request, Response, NextFunction } from 'express';
import dataStorage from "./Database.js";


// List of valid mime types and their corresponding file suffixes for file uploads. 
export const validFileTypes = {
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/png': '.png',
    'image/webp': '.webp'
};

export const defaultPictureNames = ['def-pic-1.png', 'def-pic-2.png', 'def-pic-3.png'];


/////////////////////////////////////////////////////////////////////////////////////////////
// Check for validation errors. Stop if any are found and send back error response to client. 
export function validationErrorHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const errorList = validationResult(req);
        if (!errorList.isEmpty()) {
            console.log("DEBUG: VALIDATOR", errorList.array());
            res.status(400);
            res.json({ error: 'Validation error', data: errorList.array() });
        }
        else {
            next();
        }
    }
    catch (error) {
        res.status(400);
        res.json({ error: 'Validation error', data: [{ msg: error.message }] });
    }
}


/////////////////////////////////////////////////////////////////////////////////////////////
// Called if multer's file type filter fails. Display validation error. 
export function fileErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    console.log("DEBUG: File Validation Error");
    res.status(400);
    res.json({
        error: 'Validation error', data: [{
            type: "field",
            value: "file",
            msg: err.message,
            path: "picture",
            location: "body"
        }]
    });
}


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate forum ID URL parameter
export const validateForumId = [
    param("forumId")
        .exists().withMessage('The ID of the target forum must be set.').bail()
        .isUUID('all').withMessage('Invalid Forum ID specified.').bail()
        .custom(validateForumIdExists).withMessage('The specified forum does not exist.').bail(),
];

function validateForumIdExists(value: string): boolean {
    if (dataStorage.getForum(value)) {
        return true;
    }
    return false;
}


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate thread ID URL parameter
export const validateThreadId = [
    param("threadId")
        .exists().withMessage('The ID of the target thread must be set.').bail()
        .isUUID('all').withMessage('Invalid thread ID specified.').bail()
        .custom(validateThreadIdExists).withMessage('The specified thread does not exist.').bail(),
];

function validateThreadIdExists(value: string): boolean {
    if (dataStorage.getThread(value)) {
        return true;
    }
    return false;
}


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate message ID URL parameter
export const validateMessageId = [
    param("messageId")
        .exists().withMessage('The ID of the target message must be set.').bail()
        .isUUID('all').withMessage('Invalid message ID specified.').bail()
        .custom(validateMessageIdExists).withMessage('The specified message does not exist.').bail(),
];

function validateMessageIdExists(value: string): boolean {
    if (dataStorage.getMessage(value)) {
        return true;
    }
    return false;
}


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate New Forum input
// TODO: Change icon to a file upload from the form instead.... 
export const validateNewForum = [
    body("icon")
        .exists().withMessage('The forum icon must be set.').bail()
        .trim().notEmpty().withMessage('An icon for this forum must be specified..').bail()
        .isString().withMessage('The forum icon name must be a string.').bail(),
    body("name")
        .exists().withMessage('The name of the new forum must be set.').bail()
        .trim().notEmpty().withMessage('A name of the new forum must be set.').bail()
        .isString().withMessage('The name of the new forum must be a text string.').bail()
        .isLength({ min: 2, max: 20 }).withMessage('The name of the new forum must be between 2-20 characters long.').bail()
];


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate New Thread input
export const validateNewThread = [
    body("forumId")
        .exists().withMessage('The ID of the target forum must be set.').bail()
        .isUUID('all').withMessage('Invalid target Forum ID specified.').bail()
        .custom(validateForumIdExists).withMessage('The target forum does not exist.').bail(),
    body("title")
        .exists().withMessage('The thread title must be set.').bail()
        .trim().notEmpty().withMessage('The title of the new thread must be set.').bail()
        .isString().withMessage('The title of the new thread must be a text string.').bail()
        .isLength({ min: 2, max: 40 }).withMessage('The title of the new thread must be between 2-40 characters in length.').bail(),
    body("message")
        .exists().withMessage('The message text must be set.').bail()
        .trim().notEmpty().withMessage('The message must have text content.').bail()
        .isString().withMessage('The message text must be a string.').bail()
        .isLength({ min: 2, max: 4000 }).withMessage('The message text must be between 2 to 4000 characters in length.').bail()
];


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate New Message input
export const validateNewMessage = [
    body("threadId")
        .exists().withMessage('The ID of the target thread must be set.').bail()
        .isUUID('all').withMessage('Invalid target thread ID specified.').bail()
        .custom(validateThreadIdExists).withMessage('The thread to reply to does not exist.').bail(),
    body("message")
        .exists().withMessage('The message text must be set.').bail()
        .trim().notEmpty().withMessage('The message must have text content.').bail()
        .isString().withMessage('The message text must be a string.').bail()
        .isLength({ min: 2, max: 4000 }).withMessage('The message text must be between 2 to 4000 characters in length.').bail()
];


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate New Reply input
export const validateNewReply = [
    body("messageId")
        .exists().withMessage('The ID of the target message must be set.').bail()
        .isUUID('all').withMessage('Invalid message ID specified.').bail()
        .custom(validateMessageIdExistsNotDeleted).withMessage('The specified message does not exist.').bail(),
    body("message")
        .exists().withMessage('The reply must have a message text.').bail()
        .trim().notEmpty().withMessage('The reply message must have text content.').bail()
        .isString().withMessage('The reply message text must be a string.').bail()
        .isLength({ min: 2, max: 4000 }).withMessage('The reply message text must be between 2 to 4000 characters in length.').bail()
];

function validateMessageIdExistsNotDeleted(value: string): boolean {
    const checkMessage = dataStorage.getMessage(value);
    if (checkMessage) {
        return !checkMessage.deleted;
    }
    return false;
}


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate Edit Thread input
export const validateEditThread = [
    param("threadId")
        .exists().withMessage('The ID of the target thread must be set.').bail()
        .isUUID('all').withMessage('Invalid target thread ID specified.').bail()
        .custom(validateThreadIdExists).withMessage('The thread to edit to does not exist.').bail(),
    body("title")
        .exists().withMessage('The thread title must be set.').bail()
        .trim().notEmpty().withMessage('The thread title must have text content.').bail()
        .isString().withMessage('The thread title must be a string.').bail()
        .isLength({ min: 2, max: 40 }).withMessage('The thread title must be between 2 to 40 characters in length.').bail()
];


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate Edit Message input
export const validateEditMessage = [
    body("messageId")
        .exists().withMessage('The ID of the message to edit must be set.').bail()
        .isUUID('all').withMessage('Invalid message ID specified.').bail()
        .custom(validateMessageIdExistsNotDeleted).withMessage('The message to edit could not be found.').bail(),
    body("message")
        .exists().withMessage('The message text must be set.').bail()
        .trim().notEmpty().withMessage('The message text must have text content.').bail()
        .isString().withMessage('The message text must be a string.').bail()
        .isLength({ min: 2, max: 4000 }).withMessage('The message text must be between 2 to 4000 characters in length.').bail()
];



/////////////////////////////////////////////////////////////////////////////////////////////
// Validate User profile fields - "picture" field is validated in fileErrorHandler()
export const validateUserProfile = [
    body("username")
        .exists().withMessage('The user name must be set.').bail()
        .trim().notEmpty().withMessage('The user name cannot be empty.').bail()
        .isString().withMessage('The user name must be a string.').bail()
        .isLength({ min: 2, max: 20 }).withMessage('The user name must be between 2 to 20 characters in length.').bail(),
    body("email")
        .exists().withMessage('The email address must be set.').bail()
        .trim().notEmpty().withMessage('The email address cannot be empty.').bail()
        .isEmail().withMessage('The email address is not valid.').bail(),
    body("password")
        .exists().withMessage('The password must be set.').bail()
        .isString().withMessage('The password must be a string.').bail()
        .isLength({ min: 0, max: 40 }).withMessage('The password must be between 4 to 40 characters in length.').bail()
        .custom(validateNewPassword).withMessage('The password must be entered the same twice, and be at least 4 characters long.').bail(),
    body("password-confirm")
        .exists().withMessage('The repeat password must be set.').bail()
        .isString().withMessage('The repeat password must be a string.').bail()
        .isLength({ min: 0, max: 40 }).withMessage('The repeat password must be between 4 to 40 characters in length.').bail(),
];


function validateNewPassword(value: string, { req }): boolean {
    // No new password entered, allow it through. 
    if ((value.length == 0) && (req.body['password-confirm'].length == 0)) {
        return true;
    }
    console.log("DEBUG: Validate password", value, req.body['password-confirm']);
    // Password and repeat confirm password do not match.
    if (value != req.body['password-confirm']) {
        return false;
    }
    // Password is too short. 
    if (value.length < 4) {
        return false;
    }
    return true;
}


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate User profile fields - "picture" field is validated in fileErrorHandler()
export const validateUserRegister = [
    body("username")
        .exists().withMessage('A user name must be set.').bail()
        .trim().notEmpty().withMessage('The user name cannot be empty.').bail()
        .isString().withMessage('The user name must be a string.').bail()
        .isLength({ min: 2, max: 20 }).withMessage('The user name must be between 2 to 20 characters in length.').bail()
        .custom(validateNewUserName).withMessage('The specified user name is already taken or disallowed. Choose another.').bail(),
    body("email")
        .exists().withMessage('The email address must be set.').bail()
        .trim().notEmpty().withMessage('The email address cannot be empty.').bail()
        .isEmail().withMessage('The email address is not valid.').bail(),
    body("password")
        .exists().withMessage('A desired password must be specified.').bail()
        .isString().withMessage('The password must be a string.').bail()
        .isLength({ min: 4, max: 40 }).withMessage('The password must be between 4 to 40 characters in length.').bail()
];


function validateNewUserName(value: string, { req }): boolean {
    const currUser = dataStorage.getUserByName(value);
    if (currUser) {
        return false;
    }
    return true;
}


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate user ID parameter
export const validateUserId = [
    param("userId")
        .exists().withMessage('The user ID of an existing user must be specified.').bail()
        .isUUID('all').withMessage('Invalid User ID specified.').bail()
        .custom(validateUserIdExists).withMessage('The specified user does not exist.').bail(),
];

export const validateProfileUserId = [
    param("userId")
        .exists().withMessage('The user ID of the profile to show must be specified.').bail()
        .isUUID('all').withMessage('No valid user ID has been set to display the profile of.').bail()
        .custom(validateUserIdExists).withMessage('The user does not exist, unable to display profile.').bail(),
];

function validateUserIdExists(value: string): boolean {
    if (dataStorage.getUser(value)) {
        return true;
    }
    return false;
}


/////////////////////////////////////////////////////////////////////////////////////////////
// Validate user ID parameter
export const validateSearchString = [
    body("searchFor")
        .exists().withMessage('A search criteria must be specified.').bail()
        .isString().withMessage('The text to search for must be specified.').bail()
        .isLength({ min: 1, max: 40 }).withMessage('The search criteria must be between 1 to 40 characters in length.').bail()
];

