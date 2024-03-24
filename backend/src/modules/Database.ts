/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    Database.ts
    Database abstraction layer. 
    Class and global object for reading and writing subsets of data in the database. 
    Currently uses simple JSON file storage, but could be replaced with an actual database here
    using the same public methods. 
    
    Initializes storage and caches data from files in the storage property. 
*/
import DataStore from "./Datastore.js";
import crypto from 'crypto';
import { generatePasswordHash, generateRandomSalt } from "./password.js";
import {
    ForumUser,
    ForumMessage,
    ForumThread,
    Forum,
    ForumInfo,
    ForumThreadInfo,
    UserData,
    ForumThreadStats,
    ForumAuthor,
    PublicUserProfile,
    PublicUserProfilePost,
    ForumMessageContext
} from "./TypeDefs.js";


// TODO: Better error handling and parameter validation. 

class Database {
    public storage: DataStore;

    constructor() {
        this.storage = new DataStore();
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Cache data from the storage JSON files on disk
    public initialize(): void {
        this.storage.loadForums();
        this.storage.loadUsers();
        console.log("Data storage initialized");
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Find the user with the specified userid
    public getUserList(): ForumAuthor[] {
        const userList: ForumAuthor[] = [];
        for (const user of this.storage.userDB) {
            const userListEntry: ForumAuthor = {
                id: user.id,
                userName: user.name,
                picture: user.picture,
                admin: user.admin
            }
            userList.push(userListEntry);
        }
        return userList;
    }

    ////////////////////////////////////////////////////////////////////////////////////
    // Find the user with the specified userid
    public getPublicUserProfile(userId: string): PublicUserProfile | null {

        const user = this.getUser(userId);
        if (user) {
            const messages = this.getMessagesByUser(userId);
            const profile: PublicUserProfile = {
                id: user.id,
                userName: user.name,
                picture: user.picture,
                admin: user.admin,
                recentPosts: [],
                postCount: 0
            }

            for (const msgContainer of messages) {
                const profileMessage: PublicUserProfilePost = {
                    id: msgContainer.message.id,
                    threadId: msgContainer.thread.id,
                    title: msgContainer.thread.title,
                    message: msgContainer.message.message,
                    date: msgContainer.message.date
                }
                profile.recentPosts.push(profileMessage);
            }

            profile.postCount = profile.recentPosts.length;
            return profile;
        }

        return null;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Find the user with the specified userid
    public getUser(userId: string): ForumUser | null {
        const foundUser = this.storage.userDB.find((checkUser) => checkUser.id == userId);
        return foundUser ?? null;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Find the user with the specified name
    public getUserByName(userName: string): ForumUser | null {
        const foundUser = this.storage.userDB.find((checkUser) => checkUser.name == userName);
        return foundUser ?? null;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Create and save a new user account
    public addUser(userName: string, password: string, email: string): ForumUser {
        if (this.getUserByName(userName)) {
            throw new Error("The specified user name is already taken or not allowed for use.");
        }

        const token = generateRandomSalt();
        const newUser: ForumUser = {
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


    ////////////////////////////////////////////////////////////////////////////////////
    // Edit the info of an existing user account
    public editUser(userId: string, userName: string = "", password: string = "", email: string = "", picture: string = "") {
        const userObj = this.getUser(userId);
        if (userObj) {
            userObj.name = userName.length ? userName : userObj.name;
            userObj.email = email.length ? email : userObj.email;
            userObj.password = password.length ? generatePasswordHash(password, userObj.token) : userObj.password;
            userObj.picture = picture.length ? picture : userObj.picture;
            this.storage.saveUsers();

            const userData: UserData = {
                id: userObj.id,
                name: userObj.name,
                email: userObj.email,
                picture: userObj.picture,
                admin: userObj.admin
            };
            return userData;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Create a new empty forum with the specified name and icon.
    public addForum(forumName: string, forumIcon: string): Forum {
        const newForum: Forum = {
            id: crypto.randomUUID(),
            name: forumName,
            icon: forumIcon,
            threads: []
        }
        this.storage.forumDB.push(newForum);
        this.storage.saveForums();
        return newForum;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Add a new thread to the forum with the specified forum ID.
    public addThread(forumId: string, threadTitle: string, skipSaving: boolean = false): ForumThread {
        const newThread: ForumThread = {
            id: crypto.randomUUID(),
            title: threadTitle,
            date: Date.now(),
            active: true,
            posts: []
        }
        const targetForum = this.getForum(forumId);
        if (targetForum) {
            targetForum.threads.push(newThread);
            if (!skipSaving) {
                this.storage.saveForums();
            }
        }
        else {
            throw new Error("Target forum of new thread not found.");
        }
        return newThread;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Add a new message to the thread with the specified thread ID
    public addMessage(threadId: string, authorId: string, messageText: string): ForumMessage {
        const userAuthor = this.getUser(authorId);
        if (userAuthor) {
            const targetThread: ForumThread = this.getThread(threadId);
            if (targetThread) {
                const newMessage: ForumMessage = {
                    id: crypto.randomUUID(),
                    author: {
                        id: userAuthor.id,
                        userName: userAuthor.name,
                        picture: userAuthor.picture,
                        admin: userAuthor.admin
                    },
                    message: messageText,
                    deleted: false,
                    date: Date.now(),
                    replies: []
                }

                targetThread.posts.push(newMessage);
                this.storage.saveForums();
                return newMessage;
            }
            else {
                throw new Error("Target thread not found when creating a new message.")
            }
        }
        else {
            throw new Error("Unable to find a valid user to set as author of new message.");
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Create a new reply to the message with the specified message ID, by the user 
    // matching the User ID.
    public addReply(messageId: string, authorId: string, messageText: string): ForumMessage {
        const userAuthor = this.getUser(authorId);
        if (userAuthor) {
            const targetMsg: ForumMessage = this.getMessage(messageId);
            if (targetMsg) {
                const newMessage: ForumMessage = {
                    id: crypto.randomUUID(),
                    author: {
                        id: userAuthor.id,
                        userName: userAuthor.name,
                        picture: userAuthor.picture,
                        admin: userAuthor.admin
                    },
                    message: messageText,
                    deleted: false,
                    date: Date.now(),
                    replies: []
                }

                targetMsg.replies.push(newMessage);
                this.storage.saveForums();
                return newMessage;
            }
            else {
                throw new Error("Target message not found when creating a new reply.")
            }
        }
        else {
            throw new Error("Unable to find a valid user to set as author of new reply.");
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Edit the title of an existing thread.
    public editThread(threadId: string, title: string): ForumThread | null {
        const thread = this.getThread(threadId);
        if (thread) {
            thread.title = title;
            this.storage.saveForums();
        }
        return thread;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Delete an exiting thread from its forum (along with all its messages). 
    public deleteThread(threadId: string): void {
        const thread = this.getThread(threadId);
        if (thread) {
            const parentForum = this.findContainerElement(threadId) as Forum;
            if (parentForum) {
                const idx: number = parentForum.threads.findIndex((thread) => thread.id == threadId);
                if (idx !== -1) {
                    parentForum.threads.splice(idx, 1);
                    this.storage.saveForums();
                }
            }
        };
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Edit the content of an existing message with the specified ID. 
    public editMessage(messageId: string, messageText: string): ForumMessage | null {
        const msg = this.getMessage(messageId);
        if (msg) {
            msg.message = messageText;
            this.storage.saveForums();
        }
        return msg;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Delete a message (along with all its replies). 
    public deleteMessage(messageId: string): void {
        const msg = this.getMessage(messageId);
        if (msg) {
            const messageParent = this.findContainerElement(messageId) as ForumThread | ForumMessage;
            if (messageParent) {
                if ((messageParent as ForumThread).posts) {
                    const idx: number = (messageParent as ForumThread).posts.findIndex((message) => message.id == messageId);
                    if (idx !== -1) {
                        (messageParent as ForumThread).posts.splice(idx, 1);
                    }
                }
                else if ((messageParent as ForumMessage).replies) {
                    const idx: number = (messageParent as ForumMessage).replies.findIndex((message) => message.id == messageId);
                    if (idx !== -1) {
                        (messageParent as ForumMessage).replies.splice(idx, 1);
                    }
                }
                this.storage.saveForums();
            }
        };
    }

    ////////////////////////////////////////////////////////////////////////////////////
    // Mark a message as deleted, but keep it (any any replies) in the database. 
    public softDeleteMessage(messageId: string, isDeleted: boolean): ForumMessage | null {
        const msg = this.getMessage(messageId);
        if (msg) {
            msg.deleted = isDeleted;
            this.storage.saveForums();
        }
        return msg;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Get data about all available forums (but not the actual threads and messages)
    public getForumList(): ForumInfo[] {
        const forumList: ForumInfo[] = [];
        for (const forum of this.storage.forumDB) {
            const forumData: ForumInfo = {
                id: forum.id,
                name: forum.name,
                icon: forum.icon,
                threadCount: forum.threads.length
            };
            forumList.push(forumData);
        }
        return forumList;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Find the forum with the specified forum id.
    public getForum(forumId: string): Forum | null {
        const foundForum = this.storage.forumDB.find((checkForum) => checkForum.id == forumId);
        return foundForum ?? null;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Get a list of all available threads in the specified forum (but not their actual posts)
    public getThreadList(forumId: string): ForumThreadInfo[] {
        const threadList: ForumThreadInfo[] = [];
        const foundForum = this.storage.forumDB.find((checkForum) => checkForum.id == forumId);
        if (foundForum) {
            for (const thread of foundForum.threads) {
                const threadStats = this.getThreadStats(thread.id);
                const threadData: ForumThreadInfo = {
                    id: thread.id,
                    title: thread.title,
                    date: thread.date,
                    active: thread.active,
                    postCount: threadStats.postCount,
                    lastUpdate: threadStats.lastUpdated,
                    lastAuthor: threadStats.lastAuthor
                };
                threadList.push(threadData);
            }
        }
        return threadList;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Find the thread with the specified thread ID.
    public getThread(threadId: string): ForumThread | null {
        let foundThread = null;
        for (const forum of this.storage.forumDB) {
            foundThread = forum.threads.find((checkThread) => checkThread.id == threadId);
            if (foundThread) {
                break;
            }
        }
        return foundThread ?? null;
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Find the message with the specified message ID
    public getMessage(messageId: string): ForumMessage | null {
        // Search all forum threads for the message ID
        function threadsSearch(messageId: string, database: Database): ForumMessage | null {
            let foundMsg: ForumMessage | null = null;
            for (const forum of database.storage.forumDB) {
                for (const thread of forum.threads) {
                    foundMsg = messageSearch(messageId, thread.posts);
                    if (foundMsg) {
                        return foundMsg;
                    }
                }
            }
            return null;
        }

        // Recursively search reply chains for a matching message ID.
        function messageSearch(messageId: string, messages: ForumMessage[]): ForumMessage | null {
            for (const message of messages) {
                if (message.id === messageId) {
                    return message;
                }
                else if (message.replies && message.replies.length) {
                    const result = messageSearch(messageId, message.replies);
                    if (result) {
                        return result;
                    }
                }
            }
        }
        return threadsSearch(messageId, this);
    }

    ////////////////////////////////////////////////////////////////////////////////////
    // Find all messages posted by the specified user.
    public getMessagesByUser(userId: string): ForumMessageContext[] {
        let foundMessages: ForumMessageContext[] = [];

        // Search all forum threads for the message ID
        function threadsSearch(userId: string, database: Database): ForumMessageContext[] {
            for (const forum of database.storage.forumDB) {
                for (const thread of forum.threads) {
                    messageSearch(userId, thread.posts, thread);
                }
            }
            return foundMessages;
        }

        // Recursively search reply chains for a matching message ID.
        function messageSearch(userId: string, messages: ForumMessage[], thread: ForumThread): void {
            for (const message of messages) {
                if (message.author.id === userId) {
                    const msgContainer: ForumMessageContext = {
                        message: message,
                        thread: thread
                    }
                    foundMessages.push(msgContainer);
                }
                if (message.replies && message.replies.length) {
                    messageSearch(userId, message.replies, thread);
                }
            }
        }
        return threadsSearch(userId, this);
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Find the forum a thread belongs to, the thread a message belongs to, 
    // or the message a reply belongs to. 
    public findContainerElement(searchId: string): Forum | ForumThread | ForumMessage | null {
        // Search for a thread or message matching the specified ID
        function parentMessageSearch(searchId: string, database: Database): Forum | ForumThread | ForumMessage | null {
            for (const forum of database.storage.forumDB) {
                for (const thread of forum.threads) {
                    if (thread.id == searchId) {
                        return forum;
                    }
                    for (const message of thread.posts) {
                        if (message.id == searchId) {
                            return thread;
                        }
                        const reply = parentReplySearch(searchId, message.replies, message);
                        if (reply) {
                            return reply;
                        }
                    }
                }
            }
            return null;
        }

        // Recursively search reply chains for a matching message ID and return the message it is a reply to. 
        function parentReplySearch(searchId: string, messages: ForumMessage[], parent: ForumMessage): ForumMessage | null {
            for (const message of messages) {
                if (message.id === searchId) {
                    return parent;
                }
                else if (message.replies && message.replies.length) {
                    const result = this.parentReplySearch(searchId, message.replies, message);
                    if (result) {
                        return parent;
                    }
                }
            }
        }
        return parentMessageSearch(searchId, this);
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Update the author info on messages posted by the specified user to match their
    // current user record. 
    public updateAuthorInfo(userId: string): void {
        let postCounter: number;

        function updateAuthorInfoMessages(userId: string, database: Database): void {
            postCounter = 0;
            const user = database.getUser(userId);
            if (user) {
                for (const forum of database.storage.forumDB) {
                    for (const thread of forum.threads) {
                        for (const message of thread.posts) {
                            if (message.author.id == userId) {
                                message.author.userName = user.name;
                                message.author.picture = user.picture;
                                message.author.admin = user.admin;
                                postCounter++;
                            }
                            updateAuthorInfoReplies(userId, message.replies, user);
                        }
                    }
                }
                if (postCounter) {
                    database.storage.saveForums();
                }
            }
        }

        // Helper method to recursively update the author info on any replies made by the specified user.  
        function updateAuthorInfoReplies(userId: string, messages: ForumMessage[], user: ForumUser): void {
            for (const message of messages) {
                if (message.author.id === userId) {
                    message.author.userName = user.name;
                    message.author.picture = user.picture;
                    postCounter++;
                }
                if (message.replies && message.replies.length) {
                    updateAuthorInfoReplies(userId, message.replies, user);
                }
            }
        }

        return updateAuthorInfoMessages(userId, this);
    }


    ////////////////////////////////////////////////////////////////////////////////////
    // Count the number of messages (including replies) a thread contains, and find the 
    // date and author of the most recent one. 
    public getThreadStats(threadId: string): ForumThreadStats {
        let threadStats: ForumThreadStats = {
            postCount: 0,
            lastUpdated: 0,
            lastAuthor: ""
        }

        // Function to count the messages and get the date of the latest message
        function checkThreadMessages(threadId: string, database: Database): ForumThreadStats {
            const thread = database.getThread(threadId);
            threadStats.postCount = 0;
            if (thread) {
                for (const message of thread.posts) {
                    threadStats.postCount++;
                    if (message.date > threadStats.lastUpdated) {
                        threadStats.lastUpdated = message.date;
                        threadStats.lastAuthor = message.author.userName;
                    }
                    checkThreadReplies(message.replies);
                }
            }
            return threadStats;
        }

        // Function to count the replies and get the date of the latest reply/message
        function checkThreadReplies(messages: ForumMessage[]): void {
            for (const message of messages) {
                threadStats.postCount++;
                if (message.date > threadStats.lastUpdated) {
                    threadStats.lastUpdated = message.date;
                    threadStats.lastAuthor = message.author.userName;
                }
                if (message.replies && message.replies.length) {
                    checkThreadReplies(message.replies);
                }
            }
        }

        return checkThreadMessages(threadId, this);
    }
}



// Create global dataStorage object for accessing and saving data to disk. 
const dataStorage = new Database();

export default dataStorage;