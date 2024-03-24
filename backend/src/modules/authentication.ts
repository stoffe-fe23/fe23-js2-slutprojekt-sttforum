/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    authentication.ts
    Module for authenticating users using the passport local strategy. 
    Initializes an express session for users to store authentication data.
    Session data is stored in the "sessions" folder since we lack a proper database.
*/
import session from "express-session";
import passport from 'passport';
import passportLocalStrategy from 'passport-local';
import sessionFileStore from 'session-file-store';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

import dataStorage from "./Database.js";
import { ForumUser, UserData } from "./TypeDefs.js";
import { generatePasswordHash } from "./password.js";
import userAPI from "./userAPI.js";
import { isLoggedIn } from "./permissions.js";

const LocalStrategy = passportLocalStrategy.Strategy;
const FileStore = sessionFileStore(session);
const fileStoreOptions = {};

// Read environment variables from the .env file in the backend root. 
// Accessed via process.env.* below. 
dotenv.config();

// Add "user" as an allowed property in the session data
declare module "express-session" {
    interface SessionData {
        passport: {
            user: ForumUser
        };
    }
}

// Set up user session with 1 day cookie expiration.
export const sessionSetup = session({
    secret: process.env.SESSION_SECRET,
    store: new FileStore(fileStoreOptions),
    resave: false,
    saveUninitialized: true,
    cookie: {
        sameSite: false,
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: false,
        secure: false,
    }
});


// Configure the name of the fields in the login form that passport will look for. 
const passportCustomFields = {
    usernameField: "username",
    passwordField: "password"
}

// Store only the UserId of authenticated users in their session data.
passport.serializeUser((user: ForumUser, done) => {
    done(null, user.id);
});

// Fetch the full user object based on the UID stored in the session. 
// Accessed via req.user in middleware. 
passport.deserializeUser((userId: string, done) => {
    const user: ForumUser = dataStorage.getUser(userId);
    if (user) {
        done(null, user);
    }
    else {
        done(new Error("User not found!"));
    }
});

// Set up local strategy (username/password login) authentication for passport. 
passport.use(new LocalStrategy(passportCustomFields, verifyLogin));



////////////////////////////////////////////////////////////////////////////////////
// Route for the login form to post to. POST req requires the "username" and "password"
// fields (configurable in passportCustomFields if needed).
userAPI.post("/login", passport.authenticate('local', { failWithError: true }), loginAuthenticationError, (req: Request, res: Response, next: NextFunction) => {
    const sessionUser = req.user as ForumUser;  // req.session.passport.user
    const currentUser: UserData = {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        picture: sessionUser.picture,
        admin: sessionUser.admin
    }
    console.log("DEBUG: LOGIN", currentUser);
    res.json({ message: `Login successful`, data: currentUser });
});


////////////////////////////////////////////////////////////////////////////////////
// Route for an authenticated user to log off manually. 
userAPI.get("/logout", isLoggedIn, (req: Request, res: Response, next: NextFunction) => {
    req.logout((error) => {
        console.log("LOGOFF", req.user);
        if (error) {
            return next(error);
        }
        res.json({ message: `Logout successful` });
    });
});


////////////////////////////////////////////////////////////////////////////////////
// Logic for verifying a login attempt - does the user exist, and does the password match?
function verifyLogin(username: string, password: string, returnCallback: Function) {
    try {
        const user = dataStorage.getUserByName(username);
        console.log("VERIFY", username, user);
        if (user) {
            try {
                if (user.password != generatePasswordHash(password, user.token)) {
                    return returnCallback(null, false, { message: 'Incorrect username or password.' });
                }
                return returnCallback(null, user);
            }
            catch (error) {
                return returnCallback(error);
            }
        }
        else {
            return returnCallback(null, false, { message: 'Invalid username or password.' });
        }
    }
    catch (error) {
        return returnCallback(error);
    }
}


////////////////////////////////////////////////////////////////////////////////////
// Handle user login errors. 
function loginAuthenticationError(err: Error, req: Request, res: Response, next: NextFunction) {
    console.log("DEBUG: LOGIN ERROR");
    res.status(401);
    res.json({ error: `Login failed`, data: err });
}


export { passport };