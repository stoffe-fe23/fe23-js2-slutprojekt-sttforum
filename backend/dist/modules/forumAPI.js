/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    forumAPI.ts
    API endpoints for managing forums, threads and posts.
*/
import { Router } from "express";
import dataStorage from "./Database.js";
// Router for the /api/forum path endpoints 
const forumAPI = Router();
// TODO: Validation!
// TODO: Authentication! 
/*
    Get data
*/
// Get list of all available forums
forumAPI.get('/list', (req, res) => {
    const forumList = dataStorage.getForumList();
    console.log("Getting forum list", forumList);
    if (forumList) {
        res.json(forumList);
    }
    else {
        res.status(404);
        res.json({ error: `There are currenly no available forums to show.` });
    }
});
// Get a list of all threads within the specified forum (but not their messages)
forumAPI.get('/threads/list/:forumId', (req, res) => {
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
forumAPI.get('/get/:forumId', (req, res) => {
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
// Get all data about a thread with the specified ID
forumAPI.get('/thread/get/:threadId', (req, res) => {
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
forumAPI.get('/message/get/:messageId', (req, res) => {
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
forumAPI.post('/create', (req, res) => {
    // TODO: Validation
    // TODO: Authentication -- admin only
    try {
        const newForum = dataStorage.addForum(req.body.name, req.body.icon);
        res.json({ message: `New forum added`, data: newForum });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new forum. (${error.message})` });
    }
});
// Create new thread
forumAPI.post('/thread/create', (req, res) => {
    // TODO: Validation
    // TODO: Authentication -- logged in
    try {
        const newThread = dataStorage.addThread(req.body.forumId, req.body.title);
        res.json({ message: `New thread added`, data: newThread });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new discussion thread. (${error.message})` });
    }
});
// Create new message
forumAPI.post('/message/create', (req, res) => {
    // TODO: Validation
    // TODO: Authentication -- logged in
    try {
        const authorId = "f9258ea6-89c5-46b6-8577-9df9c343dc96"; // TODO: Get the user ID of the user sending the request.
        const newMessage = dataStorage.addMessage(req.body.threadId, authorId, req.body.message);
        res.json({ message: `New post added`, data: newMessage });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new message. (${error.message})` });
    }
});
// Create new reply
forumAPI.post('/message/reply', (req, res) => {
    // TODO: Validation
    // TODO: Authentication -- logged in
    // addReply(messageId: string, authorId: string, messageText: string)
    try {
        const authorId = "f9258ea6-89c5-46b6-8577-9df9c343dc96"; // "5bcca996-929a-4451-a889-3a2267c6e216"; // TODO: Get the user ID of the user sending the request.
        const newReply = dataStorage.addReply(req.body.messageId, authorId, req.body.message);
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
forumAPI.patch('/thread/edit/:threadId', (req, res) => {
    console.log("TODO: Edit thread");
    res.json({ message: `TODO: Edit thread`, data: req.params.threadId });
});
// TODO: Delete the specified thread
forumAPI.delete('/thread/delete/:threadId', (req, res) => {
    console.log("TODO: Delete thread");
    res.json({ message: `TODO: Delete thread`, data: req.params.threadId });
});
// TODO: Edit (the message text of) the specified message
forumAPI.patch('/message/edit/:messageId', (req, res) => {
    console.log("TODO: Edit message");
    res.json({ message: `TODO: Edit message`, data: req.params.messageId });
});
// TODO:  Delete the specified message
forumAPI.delete('/message/delete/:messageId', (req, res) => {
    console.log("TODO: Delete message");
    res.json({ message: `TODO: Delete message`, data: req.params.messageId });
});
export default forumAPI;
