/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    forumAPI.ts
    API endpoint routes for managing forums, threads and posts.
*/
import { Router, Request, Response, NextFunction } from 'express';
import dataStorage from "./Database.js";
import { isLoggedIn, isOwner, isAdmin } from "./permissions.js";
import { ForumInfo, ForumUser, ForumContentInfo, ForumThreadInfo } from "./TypeDefs.js";
import { sendClientUpdate } from "./server.js";
import {
    validationErrorHandler,
    validateForumId,
    validateThreadId,
    validateMessageId,
    validateNewForum,
    validateNewThread,
    validateNewMessage,
    validateNewReply,
    validateEditThread,
    validateEditMessage,
    validateSearchString
} from "./validation.js";

// Router for the /api/forum path endpoints 
const forumAPI = Router();

// TODO: Edit/delete routes with input validation

/*********************************************************************************************
*   Get data
*********************************************************************************************/

//////////////////////////////////////////////////////////////////////////////////////////////
// Get list of all available forums
forumAPI.get('/list', (req: Request, res: Response) => {
    const forumList = dataStorage.getForumList();
    if (forumList) {
        res.json(forumList);
    }
    else {
        res.status(404);
        res.json({ error: `No forums` });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Get a list of all threads within the specified forum (but not their messages)
forumAPI.get('/threads/list/:forumId', isLoggedIn, validateForumId, validationErrorHandler, (req: Request, res: Response) => {
    try {
        const forumThreads = dataStorage.getThreadList(req.params.forumId);
        if (forumThreads) {
            res.json(forumThreads);
        }
        else {
            res.status(404);
            res.json({ error: `Forum not found`, data: req.params.forumId ?? "No forum ID" });
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to load thread. (${error.message})` });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Get all data about a forum with the specified ID, including any messages contained within. 
forumAPI.get('/get/:forumId', isLoggedIn, validateForumId, validationErrorHandler, (req: Request, res: Response) => {
    try {
        const forum = dataStorage.getForum(req.params.forumId);
        if (forum) {
            const forumData: ForumContentInfo = {
                id: forum.id,
                name: forum.name,
                icon: forum.icon.length ? forum.icon : "forum-icon.png",
                threads: []
            }
            for (const thread of forum.threads) {
                const threadStats = dataStorage.getThreadStats(thread.id);
                const threadData: ForumThreadInfo = {
                    id: thread.id,
                    title: thread.title,
                    date: thread.date,
                    active: thread.active,
                    postCount: threadStats.postCount,
                    lastUpdate: threadStats.lastUpdated,
                    lastAuthor: threadStats.lastAuthor
                }
                forumData.threads.push(threadData);
            }
            res.json(forumData);
        }
        else {
            res.status(404);
            res.json({ error: `Forum not found`, data: req.params.forumId ?? "No forum ID" });
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to load forum. (${error.message})` });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Get information about forum with the specified ID, but not its messages content. 
forumAPI.get('/data/:forumId', validateForumId, validationErrorHandler, (req: Request, res: Response) => {
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
            res.status(404);
            res.json({ error: `Forum not found`, data: req.params.forumId ?? "No forum ID" });
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to load forum data. (${error.message})` });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Get all data about a thread with the specified ID
forumAPI.get('/thread/get/:threadId', isLoggedIn, validateThreadId, validationErrorHandler, (req: Request, res: Response) => {
    try {
        const forumThread = dataStorage.getThread(req.params.threadId);
        if (forumThread) {
            res.json(forumThread);
        }
        else {
            res.status(404);
            res.json({ error: `Thread not found`, data: req.params.threadId ?? "No thread ID" });
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to load thread. (${error.message})` });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Get all data about a message with the specified ID
forumAPI.get('/message/get/:messageId', isLoggedIn, validateMessageId, validationErrorHandler, (req: Request, res: Response) => {
    try {
        const forumMessage = dataStorage.getMessage(req.params.messageId);
        if (forumMessage) {
            res.json(forumMessage);
        }
        else {
            res.status(404);
            res.json({ error: `Message not found`, data: req.params.messageId ?? "No message ID" });
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to load message. (${error.message})` });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Search for messages where the text contains the specified search criteria.
forumAPI.post('/search/messages', isLoggedIn, validateSearchString, validationErrorHandler, (req: Request, res: Response) => {
    try {
        if (!req.body.searchFor || !req.body.searchFor.length) {
            res.status(400);
            res.json({ error: `No search criteria.` });
            return;
        }

        const messages = dataStorage.findMessagesByText(req.body.searchFor);
        if (messages) {
            res.json({ message: `Message search results`, data: messages });
        }
        else {
            res.json({ message: `Message search results`, data: [] });
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to search messages. (${error.message})` });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Search for messages where the text contains the specified search criteria.
forumAPI.post('/search/threads', isLoggedIn, validateSearchString, validationErrorHandler, (req: Request, res: Response) => {
    try {
        if (!req.body.searchFor || !req.body.searchFor.length) {
            res.status(400);
            res.json({ error: `No search criteria.` });
            return;
        }

        const threads = dataStorage.findThreadsByTitle(req.body.searchFor);
        if (threads) {
            res.json({ message: `Thread search results`, data: threads });
        }
        else {
            res.json({ message: `Thread search results`, data: [] });
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to search threads. (${error.message})` });
    }
});


/*********************************************************************************************
*   Add new data
*********************************************************************************************/


//////////////////////////////////////////////////////////////////////////////////////////////
// Create new forum
forumAPI.post('/create', isAdmin, validateNewForum, validationErrorHandler, (req: Request, res: Response) => {
    try {
        const newForum = dataStorage.addForum(req.body.name, req.body.icon);
        sendClientUpdate({ action: "add", type: "forum", data: newForum }, req);
        res.status(201);
        res.json({ message: `New forum added`, data: newForum });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new forum. (${error.message})` });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Create new thread
forumAPI.post('/thread/create', isLoggedIn, validateNewThread, validationErrorHandler, (req: Request, res: Response) => {
    try {
        const authorId = (req.user as ForumUser).id;
        const newThread = dataStorage.addThread(req.body.forumId, req.body.title, true);
        dataStorage.addMessage(newThread.id, authorId, req.body.message);
        sendClientUpdate({ action: "add", type: "thread", data: newThread, source: req.body.forumId }, req);
        res.status(201);
        res.json({ message: `New thread added`, data: newThread });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new discussion thread. (${error.message})` });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Create new message
forumAPI.post('/message/create', isLoggedIn, validateNewMessage, validationErrorHandler, (req: Request, res: Response) => {
    try {
        const authorId = (req.user as ForumUser).id;
        const newMessage = dataStorage.addMessage(req.body.threadId, authorId, req.body.message);
        sendClientUpdate({ action: "add", type: "message", data: newMessage, source: req.body.threadId }, req);
        res.status(201);
        res.json({ message: `New post added`, data: newMessage });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new message. (${error.message})` });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Create new reply
forumAPI.post('/message/reply', isLoggedIn, validateNewReply, validationErrorHandler, (req: Request, res: Response) => {
    try {
        const authorId = (req.user as ForumUser).id;
        const newReply = dataStorage.addReply(req.body.messageId, authorId, req.body.message);
        sendClientUpdate({ action: "add", type: "message", data: newReply }, req);
        res.status(201);
        res.json({ message: `New reply added`, data: newReply, source: req.body.messageId });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new reply. (${error.message})` });
    }
});



/*********************************************************************************************
*   Edit existing data
*********************************************************************************************/

// Edit (the title of) the specified thread
forumAPI.patch('/thread/edit/:threadId', isAdmin, validateEditThread, validationErrorHandler, (req: Request, res: Response) => {
    console.log("DEBUG: Edit thread: ", req.params.threadId);
    try {
        const editedThread = dataStorage.editThread(req.params.threadId, req.body.title);
        sendClientUpdate({ action: "edit", type: "thread", data: editedThread }, req);
        res.json({ message: `Edited thread`, data: req.params.threadId });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `An error occured when editing thread ${req.params.threadId}.`, data: error.message });
    }

});


// Delete the specified thread
forumAPI.delete('/thread/delete/:threadId', isAdmin, validateThreadId, validationErrorHandler, (req: Request, res: Response) => {
    console.log("DEBUG: Delete thread", req.params.threadId);

    try {
        dataStorage.deleteThread(req.params.threadId);
        sendClientUpdate({ action: "delete", type: "thread", data: { id: req.params.threadId } }, req);
        res.json({ message: `Deleted thread`, data: req.params.threadId });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `An error occured when deleting thread ${req.params.threadId}.`, data: error.message });
    }
});


// Edit (the message text of) the specified message
forumAPI.patch('/message/edit', isOwner, validateEditMessage, validationErrorHandler, (req: Request, res: Response) => {
    console.log("DEBUG: Edit message", req.body.messageId);

    try {
        const editedMessage = dataStorage.editMessage(req.body.messageId, req.body.message);
        sendClientUpdate({ action: "edit", type: "message", data: editedMessage }, req);
        res.json({ message: `Edited message`, data: editedMessage });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `An error occured when editing message ${req.body.messageId}.`, data: error.message });
    }
});


// Soft-Delete the specified message (only admins can hard-delete messages)
forumAPI.delete('/message/delete/:messageId', isOwner, validateMessageId, validationErrorHandler, (req: Request, res: Response) => {
    console.log("Delete message", req.params.messageId);

    try {
        const deletedMessage = dataStorage.softDeleteMessage(req.params.messageId, true);
        sendClientUpdate({ action: "edit", type: "message", data: deletedMessage }, req);
        res.json({ message: `Deleted message`, data: req.params.messageId });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `An error occured when deleting message ${req.params.messageId}.`, data: error.message });
    }
});

// Hard-Delete (remove) the specified message, and any replies to it.
forumAPI.delete('/message/remove/:messageId', isAdmin, validateMessageId, validationErrorHandler, (req: Request, res: Response) => {
    console.log("Delete message", req.params.messageId);

    try {
        dataStorage.deleteMessage(req.params.messageId);
        sendClientUpdate({ action: "delete", type: "message", data: { id: req.params.messageId } }, req);
        res.json({ message: `Removed message`, data: req.params.messageId });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `An error occured when removing message ${req.params.messageId}.`, data: error.message });
    }
});


export default forumAPI;