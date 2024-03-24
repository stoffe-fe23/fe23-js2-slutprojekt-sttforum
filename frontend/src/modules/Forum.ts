/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    Forum.ts
    Class for managing a forum and displaying its messages. 
*/
import Thread from "./Thread";
import ForumApp from "./ForumApp";
import * as htmlUtilities from "./htmlUtilities";
import { ForumDisplayInfo, ForumAPI, ForumThreadAPI, ForumContentInfo, ForumThreadInfoAPI } from "./TypeDefs.ts";


export default class Forum {
    public id: string;
    public threads: ForumThreadInfoAPI[];
    public name: string;
    public icon: string;
    private app: ForumApp;
    private displayContainer: HTMLElement | null;

    static async create(app: ForumApp, forumId: string, onlyShowThreads: boolean = false): Promise<Forum | null> {
        // Only logged in users may see the forum content. 
        if (app.isLoggedIn()) {
            const forumData: ForumContentInfo = await app.api.getJson(`forum/get/${forumId}`);
            const icon = forumData.icon.length ? app.mediaUrl + 'forumicons/' + forumData.icon : new URL('../images/forum-icon.png', import.meta.url).toString();
            const obj = new Forum(app, forumData.id, forumData.name, icon);
            obj.threads = [];

            if (forumData.threads && forumData.threads.length) {
                for (const thread of forumData.threads) {
                    obj.threads.push(thread);
                }
            }
            return obj;
        }
        return null;
    }

    // Constructor takes the forum ID and loads info from server into the object. 
    constructor(app: ForumApp, forumId: string, forumName: string, forumIcon: string) {
        this.app = app;
        this.id = forumId;
        this.name = forumName;
        this.icon = forumIcon;
        this.threads = [];
        console.log("Loaded forum data...", this);
        // this.icon = new URL('../images/forum-icon.png', import.meta.url).toString();
    }

    // Generate HTML to display the threads in this forum
    public display(targetContainer: HTMLElement): HTMLElement {
        const values: ForumDisplayInfo = {
            name: this.name,
            icon: this.icon,
        };
        const attributes = { "data-forumid": this.id };
        const forumElement = htmlUtilities.createHTMLFromTemplate("tpl-forum", targetContainer, values, attributes);
        const threadsElement = forumElement.querySelector(`.forum-threads`) as HTMLElement;
        const newThreadForm = forumElement.querySelector(`.forum-new-thread-form`) as HTMLFormElement;

        newThreadForm.addEventListener("submit", this.onNewThreadFormSubmit.bind(this));

        // Sorts threads in falling chronological order by last update
        this.threads.sort((a, b) => b.lastUpdate - a.lastUpdate);

        for (const thread of this.threads) {
            const attributes = { "data-threadid": thread.id };
            const values = {
                id: thread.id,
                title: thread.title,
                date: htmlUtilities.dateTimeToString(thread.date),
                active: thread.active,
                postCount: thread.postCount,
                lastUpdated: htmlUtilities.dateTimeToString(thread.lastUpdate),
                lastAuthor: thread.lastAuthor,
                link: `/thread/${thread.id}`
            }
            htmlUtilities.createHTMLFromTemplate("tpl-forum-thread-list", threadsElement, values, attributes);
        }
        return forumElement;
    }


    private onNewThreadFormSubmit(event) {
        event.preventDefault();

        console.log("DEBUG: Creating new thread...");
        const form = event.currentTarget as HTMLFormElement;
        const formData = new FormData(form);

        this.newThread(formData.get("title") as string, formData.get("message") as string).then((newThread: Thread | undefined) => {
            if (newThread) {
                // TODO: Update forum display list to show new message
                console.log("DEBUG: New thread created", newThread.id);
            }
            else {
                console.log("DEBUG: Error creating new thread...");
            }

        });
    }

    public async newThread(threadTitle: string, threadMessage: string): Promise<Thread | undefined> {
        if (this.app.isLoggedIn()) {
            const newThread = await Thread.new(this.app, this.id, threadTitle, threadMessage);
            console.log("New Thread created", newThread);
            if (newThread) {
                return newThread;
            }
            else {
                throw new Error(`An error occurred when creating a new thread. (${this.id})`);
            }
        }
    }
}