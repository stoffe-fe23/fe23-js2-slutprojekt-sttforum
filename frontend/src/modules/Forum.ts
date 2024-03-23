/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    Forum.ts
    Class for managing a forum and displaying its messages. 
*/
import Thread from "./Thread";
import ForumApp from "./ForumApp";
import * as htmlUtilities from "./htmlUtilities";
import { ForumDisplayInfo, ForumAPI, ForumThreadAPI, ForumMessageAPI } from "./TypeDefs.ts";


export default class Forum {
    public id: string;
    public threads: Thread[];
    public name: string;
    public icon: string;
    private app: ForumApp;
    private displayContainer: HTMLElement | null;

    static async create(app: ForumApp, forumId: string): Promise<Forum | null> {
        // Only logged in users may see the forum content. 
        if (app.isLoggedIn()) {
            const forumData: ForumAPI = await app.api.getJson(`forum/get/${forumId}`);
            const obj = new Forum(app, forumData.id);
            obj.name = forumData.name;
            obj.icon = forumData.icon.length ? app.mediaUrl + 'forumicons/' + forumData.icon : new URL('../images/forum-icon.png', import.meta.url).toString();
            obj.threads = [];

            if (forumData.threads && forumData.threads.length) {
                for (const thread of forumData.threads) {
                    const newThread = await Thread.create(app, "0", thread);
                    if (newThread) {
                        obj.threads.push(newThread);
                    }
                }
            }
            return obj;
        }
        return null;
    }

    // Constructor takes the forum ID and loads info from server into the object. 
    constructor(app: ForumApp, forumId: string) {
        this.app = app;
        this.id = forumId;
        this.displayContainer = null;
        console.log("Loaded forum data...", this);
        // this.icon = new URL('../images/forum-icon.png', import.meta.url).toString();
    }

    // Generate HTML to display the threads in this forum
    public display(targetContainer: HTMLElement | null = null, isShowingPosts: boolean = true): HTMLElement {
        const values: ForumDisplayInfo = {
            name: this.name,
            icon: this.icon,
        };
        const attributes = { "data-forumid": this.id };

        if (targetContainer) {
            this.displayContainer = targetContainer;
        }
        else if (this.displayContainer) {
            targetContainer = this.displayContainer;
        }
        else {
            targetContainer = null;
        }

        const forumElement = htmlUtilities.createHTMLFromTemplate("tpl-forum", targetContainer, values, attributes);
        const threadsElement = forumElement.querySelector(`.forum-threads`) as HTMLElement;
        const newThreadForm = forumElement.querySelector(`.forum-new-thread-form`) as HTMLFormElement;

        newThreadForm.addEventListener("submit", this.onNewThreadFormSubmit.bind(this));

        if (isShowingPosts) {
            for (const thread of this.threads) {
                thread.display(threadsElement);
            }
        }

        return forumElement;
    }

    // Create and return a button for navigating to this forum
    public getButton(): HTMLElement {
        const forumData: ForumDisplayInfo = {
            name: this.name,
            icon: this.icon,
        };
        const attributes = { "data-forumid": this.id };
        const forumButton = htmlUtilities.createHTMLFromTemplate("tpl-forum-button", null, forumData, attributes);
        return forumButton;
    }

    private onNewThreadFormSubmit(event) {
        event.preventDefault();

        console.log("DEBUG: Creating new thread...");
        const form = event.currentTarget as HTMLFormElement;
        const formData = new FormData(form);

        this.newThread(formData.get("title") as string, formData.get("message") as string).then(() => {
            console.log("DEBUG: New thread created");

        });
    }


    public async newThread(threadTitle: string, threadMessage: string): Promise<void> {
        if (this.app.isLoggedIn()) {
            const newThread = await Thread.new(this.app, this.id, threadTitle, threadMessage);
            console.log("New Thread created", newThread);
            if (newThread) {
                this.threads.push(newThread);
                // TODO: Update forum display list to show new message
            }
            else {
                throw new Error(`An error occurred when creating a new thread. (${this.id})`);
            }
        }
    }
}