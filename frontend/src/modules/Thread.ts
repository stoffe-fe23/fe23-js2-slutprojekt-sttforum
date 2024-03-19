import Message from "./Message.ts";
import ForumApp from "./ForumApp.ts";
import * as htmlUtilities from "./htmlUtilities.ts";
import { testMessage1, testMessage2, testMessage3 } from "./testdata1.ts";


type ThreadDisplayInfo = {
    title: string,
    date: string,
}

export default class Thread {
    public readonly id: string;
    public title: string;
    public date: number;
    public posts: Message[];
    public active: boolean;
    private app: ForumApp;

    constructor(app: ForumApp, threadId: string) {
        this.app = app;

        // TODO: Load thread info from server
        this.id = threadId;
        this.title = (threadId == "1" ? "Thread title: Lorem Ipsum!" : "En annan tråd...")
        this.date = Date.now();
        this.active = true;

        this.posts = [];

        // TODO: Load message info from server
        // hardcoded Dummy test messages for 2 threads...  remove. 
        const dummyData = (threadId == "1" ? [testMessage1, testMessage2] : [testMessage3]);

        for (const messageData of dummyData) {
            this.posts.push(new Message(this.app, messageData));
        }
    }

    // Generate HTML to display this discussion thread
    public display(targetContainer: HTMLElement, isShowingPosts: boolean = true): HTMLElement {
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
}