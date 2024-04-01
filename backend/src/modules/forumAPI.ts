/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    forumAPI.ts
    API endpoint routes for managing forums, threads and posts.
*/
import { Router, Request, Response, NextFunction } from 'express';
import dataStorage from "./Database.js";
import { isLoggedIn, isOwner, isAdmin } from "./permissions.js";
import { ForumInfo, ForumUser, ForumContentInfo, ForumThreadInfo, SocketNotificationSource } from "./TypeDefs.js";
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
    validateSearchString,
    validateLikeMessage
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
// Get all data about a forum with the specified ID, and info about the threads it contains
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
            const userId = (req.user as ForumUser).id ?? null;
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
        const newMessage = dataStorage.addMessage(newThread.id, authorId, req.body.message);

        sendClientUpdate({ action: "add", type: "thread", data: newThread, source: { parent: req.body.forumId, thread: newThread.id } }, req);
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

        sendClientUpdate({ action: "add", type: "message", data: newMessage, source: { parent: req.body.threadId, thread: req.body.threadId } }, req);
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
        const parentThread = dataStorage.getMessageThread(newReply.id);

        sendClientUpdate({ action: "add", type: "reply", data: newReply, source: { parent: req.body.messageId, thread: parentThread.id } }, req);
        res.status(201);
        res.json({ message: `New reply added`, data: newReply });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `Error! Unable to add new reply. (${error.message})` });
    }
});



/*********************************************************************************************
*   Edit existing data
*********************************************************************************************/

//////////////////////////////////////////////////////////////////////////////////////////////
// Edit (the title of) the specified thread
forumAPI.patch('/thread/edit/:threadId', isAdmin, validateEditThread, validationErrorHandler, (req: Request, res: Response) => {
    console.log("DEBUG: Edit thread: ", req.params.threadId);
    try {
        const editedThread = dataStorage.editThread(req.params.threadId, req.body.title, !(req.body.active == "false"));
        sendClientUpdate({ action: "edit", type: "thread", data: editedThread }, req);
        res.json({ message: `Edited thread`, data: req.params.threadId });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `An error occured when editing thread ${req.params.threadId}.`, data: error.message });
    }

});


//////////////////////////////////////////////////////////////////////////////////////////////
// Delete the specified thread
forumAPI.delete('/thread/delete/:threadId', isAdmin, validateThreadId, validationErrorHandler, (req: Request, res: Response) => {
    console.log("DEBUG: Delete thread", req.params.threadId);

    try {
        const parentItem = dataStorage.findContainerElement(req.params.threadId);
        dataStorage.deleteThread(req.params.threadId);
        sendClientUpdate({ action: "delete", type: "thread", data: { id: req.params.threadId }, source: { parent: parentItem.id, thread: req.params.threadId } }, req);
        res.json({ message: `Deleted thread`, data: parentItem.id });
    }
    catch (error) {
        console.log("DEBUG: DELETE THREAD ERROR: ", error);
        res.status(500);
        res.json({ error: `An error occured when deleting thread ${req.params.threadId}.`, data: error.message });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
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


//////////////////////////////////////////////////////////////////////////////////////////////
// Toggle the "like" marker of the specified message by the current user. 
forumAPI.patch('/message/like/:messageId', isLoggedIn, validateLikeMessage, validationErrorHandler, (req: Request, res: Response) => {
    console.log("DEBUG: Like message", req.params.messageId);

    try {
        const user = (req.user as ForumUser);
        if (user) {
            const likedMessage = dataStorage.toggleMessageLike(req.params.messageId, user.id);
            sendClientUpdate({ action: "like", type: "message", data: likedMessage }, req);
            res.json({ message: (likedMessage ? `Liked message` : `Unliked message`), data: {} });
        }
        else {
            res.status(401);
            res.json({ error: `You must be logged in to like messages.`, data: "Not Authorized" });
        }
    }
    catch (error) {
        res.status(500);
        res.json({ error: `An error occured when liking message ${req.params.messageId}.`, data: error.message });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Soft-Delete the specified message (it is kept in the DB but marked as deleted)
forumAPI.delete('/message/delete/:messageId', isOwner, validateMessageId, validationErrorHandler, (req: Request, res: Response) => {
    console.log("Delete message", req.params.messageId);

    try {
        const parentThread = dataStorage.getMessageThread(req.params.messageId);
        const parentItem = dataStorage.findContainerElement(req.params.messageId);
        const deletedMessage = dataStorage.softDeleteMessage(req.params.messageId, true);

        sendClientUpdate({ action: "edit", type: "message", data: deletedMessage, source: { parent: parentItem.id, thread: parentThread.id } }, req);
        res.json({ message: `Deleted message`, data: req.params.messageId });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `An error occured when deleting message ${req.params.messageId}.`, data: error.message });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Hard-Delete the specified message, and any replies to it. (They are removed from the DB)
forumAPI.delete('/message/remove/:messageId', isAdmin, validateMessageId, validationErrorHandler, (req: Request, res: Response) => {
    console.log("Delete message", req.params.messageId);

    try {
        const parentThread = dataStorage.getMessageThread(req.params.messageId);
        const parentItem = dataStorage.findContainerElement(req.params.messageId);
        dataStorage.deleteMessage(req.params.messageId);
        sendClientUpdate({ action: "delete", type: "message", data: { id: req.params.messageId }, source: { parent: parentItem.id, thread: parentThread.id } }, req);
        res.json({ message: `Removed message`, data: req.params.messageId });
    }
    catch (error) {
        res.status(500);
        res.json({ error: `An error occured when removing message ${req.params.messageId}.`, data: error.message });
    }
});


export default forumAPI;