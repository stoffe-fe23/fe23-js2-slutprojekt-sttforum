import User from "./User";
import * as htmlUtilities from './htmlUtilities.ts';
import ForumApp from "./ForumApp.ts";


// Ignorera Typescript-gnäll här tills vidare, Parcel-bildklydd för testning. 
// Ta bort sen. Ska förhoppningsvis funka sen när bildlänkarna kommer från servern och inte blir kvaddade av Parcel. 
// import userIcon from "../images/user-icon.png";


type UserAuthor = {
    id: string,
    userName: string,
    picture: string
}

export type MessageData = {
    id: string,
    author: UserAuthor,
    message: string,
    deleted: boolean,
    date: number,
    replies: MessageData[]
}

type MessageDisplayInfo = {
    id: string,
    authorId: string,
    authorName: string,
    authorPicture: string,
    authorLink: string,
    message: string,
    date: string;
}

export default class Message {
    public id: string;
    public author: UserAuthor;
    public message: string;
    public deleted: boolean;
    public date: number;
    public replies: Message[];
    private app: ForumApp;

    // Create message object and fill it with the specified data, if any is assigned.
    constructor(app: ForumApp, messageData: MessageData | null) {
        this.app = app;
        if (messageData) {
            this.id = messageData.id;
            this.author = messageData.author ?? { id: 0, userName: "Unknown", picture: "" };
            this.message = messageData.message ?? "";
            this.deleted = messageData.deleted ?? false;
            this.date = messageData.date;

            // Build replies to this message
            this.replies = [];
            for (const reply of messageData.replies) {
                this.replies.push(new Message(this.app, reply));
            }
        }
    }

    // Create a new message by the currently logged in user and save it to the server. 
    public create(message: string) {
        this.date = Date.now();
        this.author = {
            id: this.app.user.id,
            userName: this.app.user.userName,
            picture: this.app.user.picture
        }
        this.message = message;
        this.deleted = false;
        this.replies = [];

        this.save();
    }

    // Load data from the server into this message. (if needing to load a single specific message)
    public load(messageId: string): void {
        // TODO: Load message info from the server into this object...
    }

    // Save this message to the server.
    public save(): void {
        // TODO: Update/save this message to the server
        // app.api.postJson('message/save', this);
        this.id = "0"; // Assign value of ID returned from server here
    }

    // Create a reply to this message 
    public addReply(messageText: string): string {
        const newReply: Message = new Message(this.app, null);
        newReply.create(messageText);
        this.replies.push(newReply);
        return newReply.id;
    }

    // Mark this message as deleted
    public delete(isDeleted: boolean = true): void {
        this.deleted = isDeleted == true;
    }

    // Generate HTML to display this message
    public display(targetContainer: HTMLElement, replyDepth: number = 0): HTMLElement {
        let values: MessageDisplayInfo = {
            id: this.id,
            authorId: this.author.id,
            authorName: this.author.userName,
            authorPicture: this.author.picture.length ? this.author.picture : new URL('../images/user-icon.png', import.meta.url).toString(),
            authorLink: `/user/profile/${this.id}`,
            message: this.message ?? "",
            date: htmlUtilities.dateTimeToString(this.date)
        };
        const attributes = { "data-messageid": this.id };

        const thisMessageElem = htmlUtilities.createHTMLFromTemplate("tpl-forum-message", targetContainer, values, attributes, true);
        const repliesElement = thisMessageElem.querySelector(`.forum-message-replies`) as HTMLElement;

        // Bara för testning, ta bort och styla ordentligt sen.
        thisMessageElem.style.marginLeft = `${replyDepth}rem`;

        replyDepth++;
        for (const message of this.replies) {
            message.display(repliesElement, replyDepth);
        }
        return thisMessageElem;
    }
}