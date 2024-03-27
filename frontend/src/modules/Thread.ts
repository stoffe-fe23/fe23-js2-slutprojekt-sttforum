/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    Thread.ts
    Class for managing a discussion thread and displaying its messages. 
*/
import Message from "./Message.ts";
import ForumApp from "./ForumApp.ts";
import * as htmlUtilities from "./htmlUtilities.ts";
import { ThreadDisplayInfo, ForumThreadAPI, ForumDisplayInfo } from "./TypeDefs.ts";



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
}