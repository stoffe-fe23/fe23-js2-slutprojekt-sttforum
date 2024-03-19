/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    Database.ts
    Class and global object for reading and writing subsets of data in the JSON "database" files. 
    Initializes storage and caches data from files in the storage property. 
*/
import DataStore from "./Datastore.js";
import { User, ForumMessage, ForumThread, Forum, ForumInfo, ForumThreadInfo } from "./TypeDefs.js";


// TODO: Better error handling and parameter validation. 

class Database {
    public storage: DataStore;

    constructor() {
        this.storage = new DataStore();
    }

    public initialize(): void {
        this.storage.loadForums();
        this.storage.loadUsers();
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
    public addThread(forumId: string, threadTitle: string): ForumThread {
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
            this.storage.saveForums();
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


    // Find the user with the specified userid
    public getUser(userId: string): User | null {
        const foundUser = this.storage.userDB.find((checkUser) => checkUser.id == userId);
        return foundUser ?? null;
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
}

// Create global dataStorage object for accessing and saving data to disk. 
const dataStorage = new Database();

export default dataStorage;