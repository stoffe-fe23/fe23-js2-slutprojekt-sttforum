/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    Message.ts
    Class for managing a message in a thread or in reply to another message. 
*/
import User from "./User";
import * as htmlUtilities from './htmlUtilities.ts';
import ForumApp from "./ForumApp.ts";
import { UserAuthor, MessageDisplayInfo, ForumMessageAPI } from "./TypeDefs.ts";


// Ignorera Typescript-gnäll här tills vidare, Parcel-bildklydd för testning. 
// Ta bort sen. Ska förhoppningsvis funka sen när bildlänkarna kommer från servern och inte blir kvaddade av Parcel. 
// import userIcon from "../images/user-icon.png";


export default class Message {
    public id: string;
    public author: UserAuthor;
    public message: string;
    public deleted: boolean;
    public date: number;
    public replies: Message[];
    private app: ForumApp;
    private displayContainer: HTMLElement | null;

    // Factory method to load message data from the server and return a message object with it. 
    static async create(app: ForumApp, messageId: string = "", messageData: ForumMessageAPI): Promise<Message | null> {
        if (app.isLoggedIn()) {
            if (!messageData && messageId.length) {
                messageData = await app.api.getJson(`forum/message/get/${messageId}`);
            }

            const obj = new Message(app, messageData);

            for (const reply of messageData.replies) {
                const newMessage = await Message.create(app, "", reply);
                if (newMessage) {
                    obj.replies.push(newMessage);
                }
            }
            return obj;
        }
        return null;
    }

    // Factory method creating a new message on the server and returning the new message object.
    static async new(app: ForumApp, targetId: string, messageText: string, messageType: 'message' | 'reply' = 'message'): Promise<Message | null> {
        if (app.isLoggedIn() && messageText.length) {
            const messageData = {
                message: messageText,
                threadId: targetId
            };
            const replyData = {
                message: messageText,
                messageId: targetId
            };

            const newMessageData: ForumMessageAPI = await app.api.postJson(`forum/message/create`, messageType == 'reply' ? replyData : messageData);
            return new Message(app, newMessageData);
        }
        return null;
    }

    // Create message object and fill it with the specified data, if any is assigned.
    constructor(app: ForumApp, messageData: ForumMessageAPI | null) {
        this.app = app;

        if (messageData) {
            this.id = messageData.id;
            this.author = messageData.author;
            this.author.picture = this.author.picture.length ? app.mediaUrl + 'userpictures/' + this.author.picture : new URL('../images/user-icon.png', import.meta.url).toString();
            this.message = messageData.message;
            this.deleted = messageData.deleted;
            this.date = messageData.date;
            this.displayContainer = null;
            this.replies = [];
        }
    }

    // Add a new reply to this message
    public async addReply(messageText: string) {
        if (this.app.isLoggedIn()) {
            const message = await Message.new(this.app, this.id, messageText, 'reply');
            if (message) {
                this.replies.push(message);
            }
            else {
                throw new Error(`An error occurred when replying to message. (${this.id})`);
            }
        }
    }

    // Mark this message as deleted
    public delete(isDeleted: boolean = true): void {
        this.deleted = isDeleted == true;
        // TODO: Uppdatera på server.... ... !!!!
    }

    // Generate HTML to display this message
    public display(targetContainer: HTMLElement | null = null, replyDepth: number = 0): HTMLElement {
        if (!this.app.isLoggedIn()) {
            throw new Error("You must be logged on to view the forum messages.");
        }

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

        if (targetContainer) {
            this.displayContainer = targetContainer;
        }
        else if (this.displayContainer) {
            targetContainer = this.displayContainer;
        }
        else {
            targetContainer = null;
        }

        const thisMessageElem = htmlUtilities.createHTMLFromTemplate("tpl-forum-message", targetContainer, values, attributes, true);
        const repliesElement = thisMessageElem.querySelector(`.forum-message-replies`) as HTMLElement;
        const replyBtns = thisMessageElem.querySelector(".forum-message-buttons") as HTMLFormElement;
        replyBtns.addEventListener("submit", this.onMessageButtonsSubmit.bind(this));



        // Bara för testning, ta bort och styla ordentligt sen.
        thisMessageElem.style.marginLeft = `${replyDepth}rem`;

        replyDepth++;
        for (const message of this.replies) {
            message.display(repliesElement, replyDepth);
        }
        return thisMessageElem;
    }
    private onMessageButtonsSubmit(event) {
        event.preventDefault();
        if (event.submitter.classList.contains("reply-btn")) {
            const messageForm = document.querySelector("#message-form") as HTMLFormElement;
            const threadIdElement = messageForm.querySelector("#reply-thredId") as HTMLInputElement;
            messageForm.showModal()

            const threadId = event.currentTarget.closest("section").dataset.threadid;
            threadIdElement.value = threadId;
            console.log("threadid", threadId, messageForm, threadIdElement)
        }
    }
}

