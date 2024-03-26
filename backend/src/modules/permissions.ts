/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    permissions.ts
    Middleware for checking if the user has access to a particular route/resource. 
*/
import { Request, Response, NextFunction } from 'express';
import { ForumUser } from "./TypeDefs.js";
import dataStorage from "./Database.js";


/////////////////////////////////////////////////////////////////////////////////////
// Check if the user is authenticated/logged in. 
export function isLoggedIn(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.isAuthenticated()) {
            return next();
        }
    }
    catch (error) {
        console.log("isLoggedIn error", error);
    }

    res.status(401);
    res.json({ error: "401 You are not authorized to access this functionality." });

}


/////////////////////////////////////////////////////////////////////////////////////
// Check if the user is logged in and has administrator permissions. 
export function isAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.isAuthenticated() && req.user && (req.user as ForumUser).admin) {
            return next();
        }
    }
    catch (error) {
        console.log("isAdmin error", error);
    }

    res.status(401);
    res.json({ error: "401 Not Authorized" });
}


/////////////////////////////////////////////////////////////////////////////////////
// Check if the user is logged in and is the owner of a particular resource, or 
// has administrator permissions. 
export function isOwner(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.isAuthenticated()) {
            if (req.user && (req.user as ForumUser).admin) {
                return next();
            }

            if (['POST', 'PATCH', 'DELETE'].includes(req.method) && req.user && req.body && req.body.messageId) {
                const msg = dataStorage.getMessage(req.body.messageId);
                if (msg) {
                    if (msg.author.id == (req.user as ForumUser).id) {
                        return next();
                    }
                }
            }
        }
    }
    catch (error) {
        console.log("IsOwner error", error);
    }

    res.status(401);
    res.json({ error: "401 Not Authorized" });
}