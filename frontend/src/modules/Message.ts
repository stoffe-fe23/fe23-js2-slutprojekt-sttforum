/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    Message.ts
    Class for managing a message in a thread or in reply to another message. 
*/
import User from "./User";
import * as htmlUtilities from './htmlUtilities.ts';
import ForumApp from "./ForumApp.ts";
import { UserAuthor, MessageDisplayInfo, ForumMessageAPI, StatusResponseAPI, APIQueryData } from "./TypeDefs.ts";


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


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Factory method to load message data from the server and return a message object with it, since constructor cannot be async...
    static async create(app: ForumApp, messageId: string = "", messageData: ForumMessageAPI | null = null): Promise<Message | null> {
        if (app.isLoggedIn()) {
            if (!messageData && messageId.length) {
                messageData = await app.api.getJson(`forum/message/get/${messageId}`);
            }

            if (messageData) {
                const obj = new Message(app, messageData);

                for (const reply of messageData.replies) {
                    const newMessage = await Message.create(app, "", reply);
                    if (newMessage) {
                        obj.replies.push(newMessage);
                    }
                }
                return obj;
            }
        }
        return null;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Factory method creating a new message on the server and returning the new message object.
    static async new(app: ForumApp, targetId: string, messageText: string, messageType: 'message' | 'reply' = 'message'): Promise<Message | null> {
        if (app.isLoggedIn() && messageText.length) {
            const apiPath = (messageType == 'reply' ? `forum/message/reply` : `forum/message/create`);
            const postData = (messageType == 'reply' ? { message: messageText, messageId: targetId } : { message: messageText, threadId: targetId }) as APIQueryData;
            const newMessageData: StatusResponseAPI = await app.api.postJson(apiPath, postData);

            if (newMessageData.message != (messageType == 'reply' ? "New reply added" : "New post added")) {
                console.log("DEBUG: Invalid response to new message request.", newMessageData);
            }
            return new Message(app, newMessageData.data as ForumMessageAPI);
        }
        return null;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Create message object and fill it with the specified data, if any is submitted.
    constructor(app: ForumApp, messageData: ForumMessageAPI | null) {
        this.app = app;
        if (messageData) {
            this.id = messageData.id;
            this.author = messageData.author;
            this.author.picture = (messageData.author && messageData.author.picture && messageData.author.picture.length) ? app.mediaUrl + 'userpictures/' + messageData.author.picture : new URL('../images/user-icon.png', import.meta.url).toString();
            this.deleted = messageData.deleted;
            this.date = messageData.date;
            this.message = messageData.message;
            this.replies = [];
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Add a new reply to this message
    public async newReply(messageText: string): Promise<Message | null> {
        const message = await Message.new(this.app, this.id, messageText, 'reply');
        if (message) {
            this.replies.push(message);
        }
        else {
            throw new Error(`An error occurred when replying to message. (${this.id})`);
        }
        return message;
        return null;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Mark this message as deleted.
    public async delete(): Promise<void> {
        const deleteResponse: StatusResponseAPI = await this.app.api.deleteJson(`forum/message/delete/${this.id}`);
        if (deleteResponse && deleteResponse.message) {
            if (deleteResponse.message != "Deleted message") {
                console.log("DEBUG: Incorrect response from Message Delete call");
            }
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Edit the content of this message. 
    public async editMessage(messageText: string): Promise<void> {
        const editedMessage: StatusResponseAPI = await this.app.api.updateJson("forum/message/edit", { messageId: this.id, message: messageText });
        if (editedMessage && editedMessage.data) {
            if (editedMessage.message && (editedMessage.message != "Edited message")) {
                console.log("DEBUG: Incorrect response from Message Edit call");
            }
            this.message = (editedMessage.data as ForumMessageAPI).message;
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Generate HTML to display this message
    public display(targetContainer: HTMLElement | null = null, replyDepth: number = 0): HTMLElement {
        let values: MessageDisplayInfo = {
            id: this.id,
            authorId: this.author.id,
            authorName: this.author.userName,
            authorPicture: this.author.picture.length ? this.author.picture : new URL('../images/user-icon.png', import.meta.url).toString(),
            authorLink: `/user/profile/${this.author.id}`,
            message: this.message ?? "",
            date: htmlUtilities.dateTimeToString(this.date)
        };
        const attributes = { "data-messageid": this.id };
        console.log("AUTHOR ID IS", this.author.id);

        const thisMessageElem = htmlUtilities.createHTMLFromTemplate("tpl-forum-message", targetContainer, values, attributes, true);
        const repliesElement = thisMessageElem.querySelector(`.forum-message-replies`) as HTMLElement;
        const replyBtns = thisMessageElem.querySelector(".forum-message-buttons") as HTMLFormElement;
        const replyButton = replyBtns.querySelector(`button[value="reply"]`) as HTMLButtonElement;
        const editButton = replyBtns.querySelector(`button[value="edit"]`) as HTMLButtonElement;
        const deleteButton = replyBtns.querySelector(`button[value="delete"]`) as HTMLButtonElement;
        replyBtns.addEventListener("submit", this.onMessageButtonsSubmit.bind(this));

        // Add admin badge next to the name if the author is an admin. 
        if (this.author.admin) {
            const authorName = thisMessageElem.querySelector(".author-name span");
            if (authorName) {
                authorName.classList.add("admin");
            }
        }

        if (this.deleted) {
            const msgWrapper = thisMessageElem.querySelector(".forum-message-wrapper") as HTMLElement;
            if (msgWrapper) {
                msgWrapper.classList.add("deleted");
            }

            replyButton.disabled = true;
            editButton.disabled = true;
            deleteButton.disabled = true;
            replyBtns.classList.add("hide");
        }
        else if ((this.app.user && this.app.user.admin) || (this.app.user && (this.app.user.id == this.author.id))) {
            editButton.disabled = false;
            deleteButton.disabled = false;
        }
        else {
            editButton.disabled = true;
            deleteButton.disabled = true;
            editButton.classList.add("hide");
            deleteButton.classList.add("hide");
        }

        // TODO: Stop drawing replies at a certain depth of the reply chain, or display differently? 
        replyDepth++;
        for (const message of this.replies) {
            message.display(repliesElement, replyDepth);
        }
        return thisMessageElem;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Submit handler for the Reply/Edit/Delete buttons on a message
    private onMessageButtonsSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget, event.submitter);
        const messageDialog = document.querySelector("#message-editor-dialog") as HTMLDialogElement;
        const messageForm = messageDialog.querySelector("#message-editor-form") as HTMLFormElement;
        const targetIdField = messageForm.querySelector("#message-editor-targetid") as HTMLInputElement;
        const messageTextField = messageForm.querySelector("#message-editor-text") as HTMLTextAreaElement;
        const editorAction = messageForm.querySelector("#message-editor-action") as HTMLInputElement;
        const threadId = event.currentTarget.closest("section").dataset.threadid ?? "";

        editorAction.value = formData.get("submit") as string;
        targetIdField.value = this.id;

        switch (editorAction.value) {
            case "reply":
                messageTextField.value = "";
                messageDialog.showModal();
                break;
            case "edit":
                messageTextField.value = this.message;
                messageDialog.showModal();
                break;
            case "delete":
                console.log("DEBUG: Delete message.");
                if (confirm("Are you sure you wish to delete this message?")) {
                    this.delete();
                }
                break;
        }
    }
}

