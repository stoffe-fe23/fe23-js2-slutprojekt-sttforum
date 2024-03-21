/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    Thread.ts
    Class for managing a discussion and displaying its messages. 
*/
import Message from "./Message.ts";
import ForumApp from "./ForumApp.ts";
import * as htmlUtilities from "./htmlUtilities.ts";
import { ThreadDisplayInfo, ForumThreadAPI } from "./TypeDefs.ts";



export default class Thread {
    public readonly id: string;
    public title: string;
    public date: number;
    public posts: Message[];
    public active: boolean;
    private app: ForumApp;

    static async create(app: ForumApp, threadId: string, threadData: ForumThreadAPI): Promise<Thread> {
        if (app.isLoggedIn()) {
            if (!threadData) {
                threadData = await app.api.getJson(`forum/thread/get/${threadId}`);
            }

            const obj = new Thread(app, threadId, threadData);

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
        return new Thread(app);
    }


    constructor(app: ForumApp, threadId: string = "", threadData: ForumThreadAPI | null = null) {
        if (threadData) {
            this.app = app;
            this.id = threadData.id;
            this.title = threadData.title;
            this.date = threadData.date;
            this.active = threadData.active;
            this.posts = [];
        }
    }

    // Generate HTML to display this discussion thread
    public display(targetContainer: HTMLElement, isShowingPosts: boolean = true): HTMLElement {
        if (!this.app.isLoggedIn()) {
            throw new Error("You must be logged on to view the forum threads.");
        }

        const values: ThreadDisplayInfo = {
            title: this.title,
            date: htmlUtilities.dateTimeToString(this.date),
        };
        const attributes = { "data-threadid": this.id };
        const threadElement = htmlUtilities.createHTMLFromTemplate("tpl-forum-thread", targetContainer, values, attributes);
        if (isShowingPosts) {
            const messagesElement = threadElement.querySelector(`.forum-thread-messages`) as HTMLElement;

            for (const message of this.posts) {
                message.display(messagesElement);
            }
        }

        return threadElement;
    }

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