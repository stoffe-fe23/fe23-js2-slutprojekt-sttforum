import session from "express-session";
import passport from 'passport';
import passportLocalStrategy from 'passport-local';
import sessionFileStore from 'session-file-store';
import dotenv from 'dotenv';

import dataStorage from "./Database.js";
import { User } from "./TypeDefs.js";
import { generatePasswordHash } from "./password.js";
import userAPI from "./userAPI.js";

const LocalStrategy = passportLocalStrategy.Strategy;
const FileStore = sessionFileStore(session);
const fileStoreOptions = {};

dotenv.config();

// Define allowed properties in the session data
declare module "express-session" {
    interface SessionData {
        views: number;
        passport: {
            user: User
        };
    }
}

export const sessionSetup = session({
    secret: process.env.SESSION_SECRET,
    store: new FileStore(fileStoreOptions),
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // expires in 1 day
    }
});


const passportCustomFields = {
    usernameField: "username",
    passwordField: "password"
}

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new LocalStrategy(passportCustomFields, verifyLogin));

userAPI.post("/login", passport.authenticate('local'), (req, res, next) => {
    console.log("SESS", req.session.passport.user.name);
    res.json({ message: `Login request successful!` });
});



function verifyLogin(username: string, password: string, returnCallback) {
    try {
        const user = dataStorage.getUserByName(username);
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

export { passport };