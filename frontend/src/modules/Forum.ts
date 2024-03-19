import Thread from "./Thread";
import ForumApp from "./ForumApp";
import * as htmlUtilities from "./htmlUtilities";

type ForumDisplayInfo = {
    name: string,
    icon: string,
};


export default class Forum {
    public id: string;
    public threads: Thread[];
    public name: string;
    public icon: string;
    private app: ForumApp;

    constructor(app: ForumApp, forumId: string) {
        this.app = app;

        // TODO: Load forum info from the server
        // Hardcoded for testing... 
        this.id = forumId;
        this.name = "Testforum";
        this.icon = new URL('../images/forum-icon.png', import.meta.url).toString(); // require('../images/forum-icon.png');

        // TODO: Load threads from this forum from server
        this.threads = [];
        // hardcoded dummy threads for testing.
        this.threads.push(new Thread(this.app, "1"));
        this.threads.push(new Thread(this.app, "2"));
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
        const values: ForumDisplayInfo = {
            name: this.name,
            icon: this.icon,
        };
        const attributes = { "data-forumid": this.id };
        const forumButton = htmlUtilities.createHTMLFromTemplate("tpl-forum-button", null, values, attributes);
        return forumButton;
    }
}