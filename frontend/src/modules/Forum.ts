/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    Forum.ts
    Class for managing a forum and displaying its threads. 
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


    constructor(app: ForumApp, forumId: string, forumName: string, forumIcon: string) {
        this.app = app;
        this.id = forumId;
        this.name = forumName;
        this.icon = forumIcon;
        this.threads = [];
    }


    /////////////////////////////////////////////////////////////////////////////////////////////
    // Factory function to load forum data from the server and return it as a new Forum object. 
    static async create(app: ForumApp, forumId: string): Promise<Forum | null> {
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


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Factory method creating a new forum on the server and returning the resulting new Forum object.
    static async new(app: ForumApp, forumName: string, forumIcon: string): Promise<Forum | null> {
        if (forumName.length && forumIcon.length) {
            const newForumData: ForumAPI = await app.api.postJson(`forum/create`, { name: forumName, icon: forumIcon });
            if (newForumData) {
                return new Forum(app, newForumData.id, newForumData.name, newForumData.icon);
            }
        }
        return null;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////
    // Generate HTML to display the info and list of the threads in this forum
    public display(targetContainer: HTMLElement): HTMLElement {
        const values: ForumDisplayInfo = {
            id: this.id,
            name: this.name,
            icon: this.icon,
        };

        const forumElement = htmlUtilities.createHTMLFromTemplate("tpl-forum", targetContainer, values, { "data-forumid": this.id });
        const threadsElement = forumElement.querySelector(`.forum-threads`) as HTMLElement;
        const newThreadForm = forumElement.querySelector(`.forum-new-thread-form`) as HTMLFormElement;

        newThreadForm.addEventListener("submit", this.onNewThreadFormSubmit.bind(this));

        const breadcrumb = forumElement.querySelector(".forum-breadcrumb") as HTMLElement;
        if (breadcrumb) {
            htmlUtilities.createHTMLElement("a", "Forums", breadcrumb, "breadcrumb-link", { href: `/forums`, "data-navigo": "true" });
            htmlUtilities.createHTMLElement("a", this.name, breadcrumb, "breadcrumb-link", { href: `/forum/${this.id}`, "data-navigo": "true" });
        }

        // Sorts threads in falling chronological order by last update
        this.threads.sort((a, b) => b.lastUpdate - a.lastUpdate);

        for (const thread of this.threads) {
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
            htmlUtilities.createHTMLFromTemplate("tpl-forum-thread-list", threadsElement, values, { "data-threadid": thread.id });
        }
        this.app.router.updatePageLinks();
        return forumElement;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////
    // Submit handler for creating a new thread in this forum.
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


    /////////////////////////////////////////////////////////////////////////////////////////////
    // Create a new thread in this forum.
    public async newThread(threadTitle: string, threadMessage: string): Promise<Thread | undefined> {
        if (this.app.isLoggedIn()) {
            const newThread = await Thread.new(this.app, this.id, threadTitle, threadMessage);
            if (newThread) {
                const newThreadInfo: ForumThreadInfoAPI = {
                    id: newThread.id,
                    title: newThread.title,
                    date: newThread.date,
                    active: newThread.active,
                    postCount: newThread.posts.length,
                    lastUpdate: Date.now(),
                    lastAuthor: ((this.app.user && this.app.user.id) ? this.app.user.id : "0")
                }
                this.threads.push(newThreadInfo);
                return newThread;
            }
            else {
                throw new Error(`An error occurred when creating a new thread. (${this.id})`);
            }
        }
    }
}