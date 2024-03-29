/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    Thread.ts
    Class for managing a discussion thread and displaying its messages. 
*/
import Message from "./Message.ts";
import ForumApp from "./ForumApp.ts";
import * as htmlUtilities from "./htmlUtilities.ts";
import { ThreadDisplayInfo, ForumThreadAPI, ForumDisplayInfo, ForumThreadStats, ForumMessageAPI } from "./TypeDefs.ts";



export default class Thread {
    public readonly id: string;
    public title: string;
    public date: number;
    public posts: Message[];
    public active: boolean;
    public forumInfo: ForumDisplayInfo | null;
    private app: ForumApp;


    constructor(app: ForumApp, threadData: ForumThreadAPI | null = null) {
        this.app = app;
        this.posts = [];

        if (threadData) {
            this.id = threadData.id;
            this.title = threadData.title;
            this.date = threadData.date;
            this.active = threadData.active;
            this.forumInfo = threadData.forum ?? null;
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Factory function for creating a new Thread object from thread data fetched from the server, 
    // or a set of complete thread data in the format received from the server. 
    static async create(app: ForumApp, threadId: string, threadData: ForumThreadAPI | null = null,): Promise<Thread | null> {
        if (!threadData && threadId.length) {
            threadData = await app.api.getJson(`forum/thread/get/${threadId}`);
        }

        if (threadData) {
            const obj = new Thread(app, threadData);

            if (threadData.posts && threadData.posts.length) {
                for (const post of threadData.posts) {
                    const newMessage = await Message.create(app, "", post);
                    if (newMessage) {
                        obj.posts.push(newMessage);
                    }
                }
            }
            return obj;
        }

        return null;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Factory method creating a new thread on the server and returning the resulting new Thread object.
    static async new(app: ForumApp, targetId: string, threadTitle: string, messageText: string): Promise<Thread | null> {
        if (threadTitle.length && messageText.length) {
            const threadData = {
                title: threadTitle,
                message: messageText,
                forumId: targetId
            };

            const newThreadData: ForumThreadAPI = await app.api.postJson(`forum/thread/create`, threadData);
            return new Thread(app, newThreadData);
        }
        return null;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Generate HTML to display this discussion thread and its message content.
    public display(targetContainer: HTMLElement | null = null): HTMLElement {
        const values: ThreadDisplayInfo = {
            title: this.title,
            date: htmlUtilities.dateTimeToString(this.date),
        };
        const attributes = { "data-threadid": this.id };

        const threadElement = htmlUtilities.createHTMLFromTemplate("tpl-forum-thread", targetContainer, values, attributes);
        const messagesElement = threadElement.querySelector(`.forum-thread-messages`) as HTMLElement;

        const newPostForm = threadElement.querySelector(`.thread-new-post-form`) as HTMLFormElement;
        newPostForm.addEventListener("submit", this.onNewPostFormSubmit.bind(this));

        // TODO: Also include date on replies to the posts in the sort order! 
        this.posts.sort((a, b) => b.date - a.date);

        for (const message of this.posts) {
            message.display(messagesElement);
        }
        this.app.router.updatePageLinks();

        return threadElement;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Generate HTML for the row of this thread in a forum thread list. 
    public getThreadListEntry() {
        const stats: ForumThreadStats = this.getThreadStats();
        const values = {
            id: this.id,
            title: this.title,
            date: htmlUtilities.dateTimeToString(this.date),
            active: this.active,
            postCount: stats.postCount,
            lastUpdated: htmlUtilities.dateTimeToString(stats.lastUpdated),
            lastAuthor: stats.lastAuthor,
            link: `/thread/${this.id}`
        }
        return htmlUtilities.createHTMLFromTemplate("tpl-forum-thread-list", null, values, { "data-threadid": this.id });
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // If this message is currently displayed on the page, update its info to match the content
    // of this object. 
    public update() {
        console.log("DEBUG: Update parent thread.", this.id);
        // Thread page, displaying its messages
        const updateThread = document.querySelector(`section[data-threadid="${this.id}"].forum-thread`);
        if (updateThread) {
            console.log("Thread - found Update Element!");
            const threadHTML = this.display();
            updateThread.replaceWith(threadHTML);
        }

        // Thread list of a forum
        const updateThreadList = document.querySelector(`article[data-threadid="${this.id}"].forum-thread-list`);
        if (updateThreadList) {
            console.log("DEBUG: Thread List - found Update Element!");
            const threadHTML = this.getThreadListEntry();
            updateThreadList.replaceWith(threadHTML);
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Add an entry for this thread to the forum thread list of the specified forum, if it is displayed
    // on the page. 
    public addToThreadListDisplay(forumId: string) {
        const parentForum = document.querySelector(`section[data-forumid="${forumId}"].forum`) as HTMLElement;
        if (parentForum) {
            const threadsBox = parentForum.querySelector(".forum-threads") as HTMLElement;
            if (threadsBox) {
                const threadHTML = this.getThreadListEntry();
                threadsBox.prepend(threadHTML);
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Submit handler for creating a new message in this thread. 
    private onNewPostFormSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        this.newMessage(formData.get("message") as string);
        form.reset();
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Create a new message in this thread by the currently logged in user and save it to the server. 
    public async newMessage(messageText: string) {
        if (this.app.isLoggedIn()) {
            const message = await Message.new(this.app, this.id, messageText);
            if (message) {
                this.posts.push(message);
            }
            else {
                throw new Error(`An error occurred when creating a new message. (${this.id})`);
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Calculate total post count, last date updated and last user who posted in this thread. 
    public getThreadStats(): ForumThreadStats {
        let threadStats: ForumThreadStats = {
            postCount: 0,
            lastUpdated: 0,
            lastAuthor: ""
        }

        // Function to count the messages and get the date of the latest message
        function checkThreadMessages(messages: Message[]): ForumThreadStats {
            threadStats.postCount = 0;
            for (const message of messages) {
                threadStats.postCount++;
                if (message.date > threadStats.lastUpdated) {
                    threadStats.lastUpdated = message.date;
                    threadStats.lastAuthor = message.author.userName;
                }
                checkThreadReplies(message.replies);
            }

            return threadStats;
        }

        // Function to count the replies and get the date of the latest reply/message
        function checkThreadReplies(messages: Message[]): void {
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

        return checkThreadMessages(this.posts);
    }
}