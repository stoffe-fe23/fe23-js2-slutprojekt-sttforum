/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

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

    static async create(app: ForumApp, forumId: string) {
        const forumData: ForumAPI = await app.api.getJson(`forum/get/${forumId}`);
        const obj = new Forum(app, forumData.id);
        obj.name = forumData.name;
        obj.icon = app.mediaUrl + 'forumicons/' + forumData.icon;
        obj.threads = [];

        if (forumData.threads && forumData.threads.length) {
            for (const thread of forumData.threads) {
                const newThread = await Thread.create(app, "0", thread);
                obj.threads.push(newThread);
            }
        }
        return obj;
    }

    // Constructor takes the forum ID and loads info from server into the object. 
    constructor(app: ForumApp, forumId: string) {
        this.app = app;
        this.id = forumId;
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

        for (const thread of this.threads) {
            thread.display(threadsElement);
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
}