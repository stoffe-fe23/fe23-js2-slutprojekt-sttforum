/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

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

    // Load data from the server into this message. (if needing to load a single specific message)
    static async create(app: ForumApp, messageId: string = "", messageData: ForumMessageAPI) {
        if (!messageData && messageId.length) {
            messageData = await app.api.getJson(`forum/message/get/${messageId}`);
        }

        const obj = new Message(app, messageId, messageData);

        for (const reply of messageData.replies) {
            const newMessage = await Message.create(app, "", reply);
            obj.replies.push(newMessage);
        }
        return obj;

    }

    // Create message object and fill it with the specified data, if any is assigned.
    constructor(app: ForumApp, messageId: string = "", messageData: ForumMessageAPI | null) {
        this.app = app;
        this.id = messageId;
        if (messageData) {
            this.author = messageData.author;
            this.author.picture = app.mediaUrl + 'userpictures/' + this.author.picture;
            this.message = messageData.message;
            this.deleted = messageData.deleted;
            this.date = messageData.date;
            this.replies = [];
        }
    }



    // Create a new message by the currently logged in user and save it to the server. 
    public newMessage(message: string) {
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


    // Save this message to the server.
    public save(): void {
        // TODO: Update/save this message to the server
        // app.api.postJson('message/save', this);
        this.id = "0"; // Assign value of ID returned from server here
    }

    // Create a reply to this message 
    public addReply(messageText: string): string {
        const newReply: Message = new Message(this.app, "", null);
        newReply.newMessage(messageText);
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
            const messageDialog = document.querySelector("#message-dialog") as HTMLFormElement;
            const threadIdElement = messageDialog.querySelector("#reply-thredId") as HTMLInputElement;
            const messageForm = document.querySelector("#message-form") as HTMLFormElement;
            messageDialog.showModal()

            const threadId = event.currentTarget.closest("section").dataset.threadid;
            threadIdElement.value = threadId;
            console.log("threadid", threadId, messageDialog, threadIdElement);

            messageForm.addEventListener("submit", (event) => {
                event.preventDefault();
                const formData = new FormData(messageForm);
                console.log(formData);

                

                messageDialog.close();
                
            })
        }
    }
}

