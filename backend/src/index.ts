/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    index.ts
    Main script for the Node.js/Express server. Set up served resources and listen for client connections. 
*/
import express from "express";
import session from "express-session";
import cors from "cors";
import forumAPI from "./modules/forumAPI.js";
import userAPI from "./modules/userAPI.js";
import dataStorage from "./modules/Database.js";
import passport from 'passport';
import LocalStrategy from 'passport-local';
import crypto from 'crypto';


const app = express();
app.use(express.json());
app.use(cors());

passport.use(new LocalStrategy(function verify(username: string, password: string, cb) {
    try {
        const user = dataStorage.getUserByName(username);
        if (user) {
            crypto.pbkdf2(password, "Very salty here 2!?", 310000, 32, 'sha256', (error, hashedPassword) => {
                if (error) {
                    return cb(error);
                }
                if (!crypto.timingSafeEqual(Buffer.from(user.password), hashedPassword)) {
                    return cb(null, false, { message: 'Incorrect username or password.' });
                }
                return cb(null, user);
            });
        }
        else {
            return cb(null, false, { message: 'Incorrect username or password.' });
        }
    }
    catch (error) {
        return cb(error);
    }
}));

userAPI.post('/api/login/password', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

passport.serializeUser(function (user, cb) {
    console.log("Serialize");
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function (user, cb) {
    console.log("Deserialize");
    process.nextTick(function () {
        return cb(null, user);
    });
});

app.use(session({
    secret: 'Salty for the session cookie id...',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.authenticate('session'));


// Serve images and other static files in the "media" folder at the root path: http://localhost:3000/media
app.use('/media', express.static('media'));

// Serve the forum API endpoints at the path:  http://localhost:3000/api/forum
app.use('/api/forum', forumAPI);

// Serve the forum API endpoints at the path:  http://localhost:3000/api/user
app.use('/api/user', userAPI);


app.use((err, req, res, next) => {
    console.log("Server error:", err);
    res.status(500);
    res.json({ error: err.message });
})


app.listen(3000, () => {
    console.log('Server listening on port 3000: http://localhost:3000/');

    // Load forum and user data from disk. 
    dataStorage.initialize();
})
