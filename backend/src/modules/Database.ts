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
import { ForumUser, ForumMessage, ForumThread, Forum, ForumInfo, ForumThreadInfo, UserData } from "./TypeDefs.js";
import { generatePasswordHash, generateRandomSalt } from "./password.js";


// TODO: Better error handling and parameter validation. 

class Database {
    public storage: DataStore;

    constructor() {
        this.storage = new DataStore();
    }

    public initialize(): void {
        this.storage.loadForums();
        this.storage.loadUsers();
        console.log("Data storage initialized");
    }


    // Find the user with the specified userid
    public getUser(userId: string): ForumUser | null {
        const foundUser = this.storage.userDB.find((checkUser) => checkUser.id == userId);
        return foundUser ?? null;
    }

    // Find the user with the specified userid
    public getUserByName(userName: string): ForumUser | null {
        const foundUser = this.storage.userDB.find((checkUser) => checkUser.name == userName);
        return foundUser ?? null;
    }

    // Find the user with the specified userid
    public getUserByToken(token: string): ForumUser | null {
        const foundUser = this.storage.userDB.find((checkUser) => (checkUser.token == token) && token.length && checkUser.token.length);
        return foundUser ?? null;
    }

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



    // Create a new forum empty with the specified name and icon.
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


    // Create a new reply to the message with the specified message ID, by the user matching the User ID.
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

    // Edit the title of an existing thread.
    public editThread(threadId: string, title: string): ForumThread | null {
        const thread = dataStorage.getThread(threadId);
        if (thread) {
            thread.title = title;
            this.storage.saveForums();
        }
        return thread;
    }

    // Delete an exiting thread from its forum (along with all its messages). 
    public deleteThread(threadId: string): void {
        const thread = dataStorage.getThread(threadId);
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

    // Edit the content of an existing message. 
    public editMessage(messageId: string, messageText: string): ForumMessage | null {
        const msg = dataStorage.getMessage(messageId);
        if (msg) {
            msg.message = messageText;
            this.storage.saveForums();
        }
        return msg;
    }

    // Delete an exiting thread from its forum (along with all its messages). 
    public deleteMessage(messageId: string): void {
        const msg = dataStorage.getMessage(messageId);
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

    // Edit the content of an existing message. 
    public softDeleteMessage(messageId: string, isDeleted: boolean): ForumMessage | null {
        const msg = dataStorage.getMessage(messageId);
        if (msg) {
            msg.deleted = isDeleted;
            this.storage.saveForums();
        }
        return msg;
    }


    // Get data about all available forums (but not their content)
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


    // Find the forum with the specified forum id.
    public getForum(forumId: string): Forum | null {
        const foundForum = this.storage.forumDB.find((checkForum) => checkForum.id == forumId);
        return foundForum ?? null;
    }


    // Get a list of all available threads in the specified forum (but not their posts)
    public getThreadList(forumId: string): ForumThreadInfo[] {
        const threadList: ForumThreadInfo[] = [];
        const foundForum = this.storage.forumDB.find((checkForum) => checkForum.id == forumId);
        if (foundForum) {
            for (const thread of foundForum.threads) {
                const threadData: ForumThreadInfo = {
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


    // Find the message with the specified message ID
    public getMessage(messageId: string): ForumMessage | null {
        let foundMsg: ForumMessage | null = null;
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
    private messageSearch(messageId: string, messages: ForumMessage[]): ForumMessage | null {
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

    private findContainerElement(searchId: string): Forum | ForumThread | ForumMessage | null {
        for (const forum of this.storage.forumDB) {
            for (const thread of forum.threads) {
                if (thread.id == searchId) {
                    return forum;
                }
                for (const message of thread.posts) {
                    if (message.id == searchId) {
                        return thread;
                    }
                    const reply = this.parentMessageSearch(searchId, message.replies, message);
                    if (reply) {
                        return reply;
                    }
                }
            }
        }
        return null;
    }

    // Helper method to recursively search reply chains for a matching message ID and return the message it is a reply to. 
    private parentMessageSearch(searchId: string, messages: ForumMessage[], parent: ForumMessage): ForumMessage | null {
        for (const message of messages) {
            if (message.id === searchId) {
                return parent;
            }
            else if (message.replies && message.replies.length) {
                const result = this.parentMessageSearch(searchId, message.replies, message);
                if (result) {
                    return parent;
                }
            }
        }
    }

    // TODO: Update the Name and picture on all messages posted by the specified user
    public updateAuthorInfo(userId: string) {
        const user = dataStorage.getUser(userId);
        if (user) {
            let postCounter: number = 0;
            for (const forum of this.storage.forumDB) {
                for (const thread of forum.threads) {
                    for (const message of thread.posts) {
                        if (message.author.id == userId) {
                            message.author.userName = user.name;
                            message.author.picture = user.picture;
                            postCounter++;
                        }
                        postCounter = this.updateAuthorInfoReplies(userId, message.replies, user, postCounter);
                    }
                }
            }
            if (postCounter) {
                this.storage.saveForums();
            }
        }
    }

    // Helper method to recursively update the author info on any replies made by the specified user.  
    private updateAuthorInfoReplies(userId: string, messages: ForumMessage[], user: ForumUser, postCounter: number): number {
        for (const message of messages) {
            if (message.author.id === userId) {
                message.author.userName = user.name;
                message.author.picture = user.picture;
                postCounter++;
            }
            if (message.replies && message.replies.length) {
                postCounter = this.updateAuthorInfoReplies(userId, message.replies, user, postCounter);
            }
        }
        return postCounter;
    }
}

// Create global dataStorage object for accessing and saving data to disk. 
const dataStorage = new Database();

export default dataStorage;