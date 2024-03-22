/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    forumAPI.ts
    API endpoint routes for managing forums, threads and posts.
*/
import { Router, Request, Response, NextFunction } from 'express';
import dataStorage from "./Database.js";
import { isLoggedIn, isOwner, isAdmin } from "./permissions.js";
import { ForumInfo, ForumUser } from "./TypeDefs.js";

// Router for the /api/forum path endpoints 
const forumAPI = Router();


// TODO: Validation!
// TODO: Authentication! 

/*
    Get data
*/

// Get list of all available forums
forumAPI.get('/list', (req: Request, res: Response) => {
    const forumList = dataStorage.getForumList();
    if (forumList) {
        res.json(forumList);
    }
    else {
        res.status(404);
        res.json({ error: `There are currenly no available forums to show.` });
    }
});


// Get a list of all threads within the specified forum (but not their messages)
forumAPI.get('/threads/list/:forumId', isLoggedIn, (req: Request, res: Response) => {
    try {
        const forumThreads = dataStorage.getThreadList(req.params.forumId);
        if (forumThreads) {
            res.json(forumThreads);
        }
        else {
            throw new Error(`No thread was found with thread id ${req.params.forumId}.`);
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to load thread. (${error.message})` });
    }
});


// Get all data about a forum with the specified ID
forumAPI.get('/get/:forumId', isLoggedIn, (req: Request, res: Response) => {
    try {
        const forum = dataStorage.getForum(req.params.forumId);
        if (forum) {
            res.json(forum);
        }
        else {
            throw new Error(`No forum was found with forum ID ${req.params.forumId}.`);
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to load forum. (${error.message})` });
    }
});

// Get information about forum with the specified ID
forumAPI.get('/data/:forumId', (req: Request, res: Response) => {
    try {
        const forum = dataStorage.getForum(req.params.forumId);
        if (forum) {
            const forumData: ForumInfo = {
                id: forum.id,
                name: forum.name,
                icon: forum.icon,
                threadCount: forum.threads.length
            }
            res.json(forumData);
        }
        else {
            throw new Error(`No forum was found with forum ID ${req.params.forumId}.`);
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to load forum data. (${error.message})` });
    }
});


// Get all data about a thread with the specified ID
forumAPI.get('/thread/get/:threadId', isLoggedIn, (req: Request, res: Response) => {
    try {
        const forumThread = dataStorage.getThread(req.params.threadId);
        if (forumThread) {
            res.json(forumThread);
        }
        else {
            throw new Error(`No thread was found with thread id ${req.params.threadId}.`);
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to load thread. (${error.message})` });
    }
});


// Get all data about a message with the specified ID
forumAPI.get('/message/get/:messageId', isLoggedIn, (req: Request, res: Response) => {
    try {
        const forumMessage = dataStorage.getMessage(req.params.messageId);
        if (forumMessage) {
            res.json(forumMessage);
        }
        else {
            throw new Error(`No message was found with message id ${req.params.messageId}.`);
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to load message. (${error.message})` });
    }
});



/*
    Add new data
*/

// Create new forum
forumAPI.post('/create', isAdmin, (req: Request, res: Response) => {
    // TODO: Validation
    // TODO: Authentication -- admin only
    try {
        const newForum = dataStorage.addForum(req.body.name, req.body.icon);
        res.status(201);
        res.json({ message: `New forum added`, data: newForum });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new forum. (${error.message})` });
    }
});


// Create new thread
forumAPI.post('/thread/create', isLoggedIn, (req: Request, res: Response) => {
    // TODO: Validation
    try {
        const newThread = dataStorage.addThread(req.body.forumId, req.body.title);
        res.status(201);
        res.json({ message: `New thread added`, data: newThread });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new discussion thread. (${error.message})` });
    }
});


// Create new message
forumAPI.post('/message/create', isLoggedIn, (req: Request, res: Response) => {
    // TODO: Validation
    try {
        const authorId = (req.user as ForumUser).id;
        const newMessage = dataStorage.addMessage(req.body.threadId, authorId, req.body.message);
        res.status(201);
        res.json({ message: `New post added`, data: newMessage });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new message. (${error.message})` });
    }
});


// Create new reply
forumAPI.post('/message/reply', isLoggedIn, (req: Request, res: Response) => {
    // TODO: Validation
    try {
        const authorId = (req.user as ForumUser).id;
        const newReply = dataStorage.addReply(req.body.messageId, authorId, req.body.message);
        res.status(201);
        res.json({ message: `New reply added`, data: newReply });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new reply. (${error.message})` });
    }
});


/*
    Edit existing data
*/

// TODO: Edit (the title of) the specified thread
forumAPI.patch('/thread/edit/:threadId', isAdmin, (req: Request, res: Response) => {
    console.log("TODO: Edit thread");
    res.json({ message: `TODO: Edit thread`, data: req.params.threadId });
});


// TODO: Delete the specified thread
forumAPI.delete('/thread/delete/:threadId', isAdmin, (req: Request, res: Response) => {
    console.log("TODO: Delete thread");
    res.json({ message: `TODO: Delete thread`, data: req.params.threadId });
});


// TODO: Edit (the message text of) the specified message
forumAPI.patch('/message/edit/:messageId', isOwner, (req: Request, res: Response) => {
    console.log("TODO: Edit message");
    res.json({ message: `TODO: Edit message`, data: req.params.messageId });
});


// TODO:  Delete the specified message
forumAPI.delete('/message/delete/:messageId', isOwner, (req: Request, res: Response) => {
    console.log("TODO: Delete message");
    res.json({ message: `TODO: Delete message`, data: req.params.messageId });
});


export default forumAPI;