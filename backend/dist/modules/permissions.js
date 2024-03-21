import dataStorage from "./Database.js";
/////////////////////////////////////////////////////////////////////////////////////
// Check if the user is authenticated/logged in. 
export function isLoggedIn(req, res, next) {
    try {
        if (req.isAuthenticated()) {
            return next();
        }
    }
    catch (error) {
        console.log("isLoggedIn error", error);
    }
    res.status(401);
    res.json({ error: "You are not authorized to access this functionality." });
}
/////////////////////////////////////////////////////////////////////////////////////
// Check if the user is logged in and has administrator permissions. 
export function isAdmin(req, res, next) {
    try {
        if (req.isAuthenticated() && req.user && req.user.admin) {
            return next();
        }
    }
    catch (error) {
        console.log("isAdmin error", error);
    }
    res.status(401);
    res.json({ error: "Not authorized." });
}
/////////////////////////////////////////////////////////////////////////////////////
// Check if the user is logged in and is the owner of a particular resource, or 
// has administrator permissions. 
export function isOwner(req, res, next) {
    // TODO: Check method, look in req.body / req.params for a message ID value,
    // look up the resource in question and see if the req.user is the "author". 
    // res.json({ message: "Test!", method: req.method, badi: req.body, params: req.params, path: req.path, url: req.url });
    try {
        if (req.isAuthenticated()) {
            if (req.user && req.user.admin) {
                return next();
            }
            if (['POST', 'PATCH', 'DELETE'].includes(req.method) && req.user && req.body && req.body.messageId) {
                const msg = dataStorage.getMessage(req.body.messageId);
                if (msg) {
                    if (msg.author.id == req.user.id) {
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
    res.json({ error: "Not authorized." });
}
