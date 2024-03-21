/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    Database.ts
    Database abstraction layer.
    Class and global object for reading and writing subsets of data in the database.
    Currently uses simple JSON file storage, but should be replaced with an actual database.
    Initializes storage and caches data from files in the storage property.
*/
import DataStore from "./Datastore.js";
import crypto from 'crypto';
import { generatePasswordHash, generateRandomSalt } from "./password.js";
// TODO: Better error handling and parameter validation. 
class Database {
    constructor() {
        this.storage = new DataStore();
    }
    initialize() {
        this.storage.loadForums();
        this.storage.loadUsers();
        console.log("Data storage initialized");
    }
    // Find the user with the specified userid
    getUser(userId) {
        const foundUser = this.storage.userDB.find((checkUser) => checkUser.id == userId);
        return foundUser ?? null;
    }
    // Find the user with the specified userid
    getUserByName(userName) {
        const foundUser = this.storage.userDB.find((checkUser) => checkUser.name == userName);
        return foundUser ?? null;
    }
    // Find the user with the specified userid
    getUserByToken(token) {
        const foundUser = this.storage.userDB.find((checkUser) => (checkUser.token == token) && token.length && checkUser.token.length);
        return foundUser ?? null;
    }
    addUser(userName, password, email) {
        if (this.getUserByName(userName)) {
            throw new Error("The specified user name is already taken or not allowed for use.");
        }
        const token = generateRandomSalt();
        const newUser = {
            id: crypto.randomUUID(),
            name: userName,
            email: email,
            picture: "user-icon.png",
            password: generatePasswordHash(password, token),
            token: token,
            admin: false
        };
        this.storage.userDB.push(newUser);
        this.storage.saveUsers();
        return newUser;
    }
    // Create a new forum empty with the specified name and icon.
    addForum(forumName, forumIcon) {
        const newForum = {
            id: crypto.randomUUID(),
            name: forumName,
            icon: forumIcon,
            threads: []
        };
        this.storage.forumDB.push(newForum);
        this.storage.saveForums();
        return newForum;
    }
    // Add a new thread to the forum with the specified forum ID.
    addThread(forumId, threadTitle) {
        const newThread = {
            id: crypto.randomUUID(),
            title: threadTitle,
            date: Date.now(),
            active: true,
            posts: []
        };
        const targetForum = this.getForum(forumId);
        if (targetForum) {
            targetForum.threads.push(newThread);
            this.storage.saveForums();
        }
        else {
            throw new Error("Target forum of new thread not found.");
        }
        return newThread;
    }
    // Add a new message to the thread with the specified thread ID
    addMessage(threadId, authorId, messageText) {
        const userAuthor = this.getUser(authorId);
        if (userAuthor) {
            const targetThread = this.getThread(threadId);
            if (targetThread) {
                const newMessage = {
                    id: crypto.randomUUID(),
                    author: {
                        id: userAuthor.id,
                        userName: userAuthor.name,
                        picture: userAuthor.picture,
                    },
                    message: messageText,
                    deleted: false,
                    date: Date.now(),
                    replies: []
                };
                targetThread.posts.push(newMessage);
                this.storage.saveForums();
                return newMessage;
            }
            else {
                throw new Error("Target thread not found when creating a new message.");
            }
        }
        else {
            throw new Error("Unable to find a valid user to set as author of new message.");
        }
    }
    // Create a new reply to the message with the specified message ID, by the user matching the User ID.
    addReply(messageId, authorId, messageText) {
        const userAuthor = this.getUser(authorId);
        if (userAuthor) {
            const targetMsg = this.getMessage(messageId);
            if (targetMsg) {
                const newMessage = {
                    id: crypto.randomUUID(),
                    author: {
                        id: userAuthor.id,
                        userName: userAuthor.name,
                        picture: userAuthor.picture,
                    },
                    message: messageText,
                    deleted: false,
                    date: Date.now(),
                    replies: []
                };
                targetMsg.replies.push(newMessage);
                this.storage.saveForums();
                return newMessage;
            }
            else {
                throw new Error("Target message not found when creating a new reply.");
            }
        }
        else {
            throw new Error("Unable to find a valid user to set as author of new reply.");
        }
    }
    // Get data about all available forums (but not their content)
    getForumList() {
        const forumList = [];
        for (const forum of this.storage.forumDB) {
            const forumData = {
                id: forum.id,
                name: forum.name,
                icon: forum.icon,
                threadCount: forum.threads.length
            };
            forumList.push(forumData);
        }
        return forumList;
    }
    // Find the forum with the specified forum id.
    getForum(forumId) {
        const foundForum = this.storage.forumDB.find((checkForum) => checkForum.id == forumId);
        return foundForum ?? null;
    }
    // Get a list of all available threads in the specified forum (but not their posts)
    getThreadList(forumId) {
        const threadList = [];
        const foundForum = this.storage.forumDB.find((checkForum) => checkForum.id == forumId);
        if (foundForum) {
            for (const thread of foundForum.threads) {
                const threadData = {
                    id: thread.id,
                    title: thread.title,
                    date: thread.date,
                    active: thread.active,
                    postCount: thread.posts.length
                };
                threadList.push(threadData);
            }
        }
        return threadList;
    }
    // Find the thread with the specified thread ID.
    getThread(threadId) {
        let foundThread = null;
        for (const forum of this.storage.forumDB) {
            foundThread = forum.threads.find((checkThread) => checkThread.id == threadId);
            if (foundThread) {
                break;
            }
        }
        return foundThread ?? null;
    }
    // Find the message with the specified message ID
    getMessage(messageId) {
        let foundMsg = null;
        for (const forum of this.storage.forumDB) {
            for (const thread of forum.threads) {
                foundMsg = this.messageSearch(messageId, thread.posts);
                if (foundMsg) {
                    return foundMsg;
                }
            }
        }
        return null;
    }
    // Helper method to recursively search reply chains for a matching message ID.
    messageSearch(messageId, messages) {
        for (const message of messages) {
            if (message.id === messageId) {
                return message;
            }
            else if (message.replies && message.replies.length) {
                const result = this.messageSearch(messageId, message.replies);
                if (result) {
                    return result;
                }
            }
        }
    }
}
// Create global dataStorage object for accessing and saving data to disk. 
const dataStorage = new Database();
export default dataStorage;
