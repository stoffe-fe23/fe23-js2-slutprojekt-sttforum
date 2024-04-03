/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    Message.ts
    Class for managing a message in either a thread or in the reply chain of another message. 
*/
import User from "./User";
import Thread from "./Thread.ts";
import * as htmlUtilities from './htmlUtilities.ts';
import ForumApp from "./ForumApp.ts";
import { UserAuthor, MessageDisplayInfo, ForumMessageAPI, StatusResponseAPI, APIQueryData } from "./TypeDefs.ts";

const MAX_REPLY_CHAIN_DEPTH = 4;

export default class Message {
    public id: string;
    public author: UserAuthor;
    public message: string;
    public deleted: boolean;
    public date: number;
    public replies: Message[];
    public likes: string[];
    public threadId: string;
    private app: ForumApp;


    constructor(app: ForumApp, messageData: ForumMessageAPI | null) {
        this.app = app;
        this.replies = [];

        if (messageData) {
            this.id = messageData.id;
            this.author = messageData.author;
            this.author.picture = app.getUserPictureUrl(messageData.author.picture);
            this.deleted = messageData.deleted;
            this.date = messageData.date;
            this.message = messageData.message;
            this.likes = messageData.likes ?? [];
            this.threadId = messageData.threadId ?? "0";
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Factory method to load message data from the server and return a message object with it, since constructor cannot be async...
    static async create(app: ForumApp, messageId: string = "", messageData: ForumMessageAPI | null = null): Promise<Message | null> {
        if (!messageData && messageId.length) {
            messageData = await app.api.getJson(`forum/message/get/${messageId}`);
        }

        if (messageData) {
            const obj = new Message(app, messageData);

            for (const reply of messageData.replies) {
                reply.threadId = messageData.threadId;
                const newMessage = await Message.create(app, "", reply);
                if (newMessage) {
                    obj.replies.push(newMessage);
                }
            }
            return obj;
        }
        return null;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Factory method creating a new message on the server and returning the new message object.
    static async new(app: ForumApp, targetId: string, messageText: string, messageType: 'message' | 'reply' = 'message', threadId: string = ""): Promise<Message | null> {
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
    // Add a new reply to this message
    public async newReply(messageText: string): Promise<Message | null> {
        const message = await Message.new(this.app, this.id, messageText, 'reply');
        if (message) {
            message.threadId = this.threadId;
            this.replies.push(message);
        }
        else {
            throw new Error(`An error occurred when replying to message. (${this.id})`);
        }
        return message;
        return null;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Soft delete this message (replies to it are kept and it is still shown but marked as deleted)
    public async delete(): Promise<void> {
        const deleteResponse: StatusResponseAPI = await this.app.api.deleteJson(`forum/message/delete/${this.id}`);
        if (deleteResponse && deleteResponse.message) {
            if (deleteResponse.message != "Deleted message") {
                console.log("DEBUG: Incorrect response from Message Delete call");
            }
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Completely remove this message, and all replies to it. (admin-only)
    public async remove(): Promise<void> {
        const deleteResponse: StatusResponseAPI = await this.app.api.deleteJson(`forum/message/remove/${this.id}`);
        if (deleteResponse) {
            console.log("DEBUG: Remove message", deleteResponse);
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
    public display(targetContainer: HTMLElement | null = null, allowEditing: boolean = true, replyDepth: number = 0): HTMLElement {
        const values: MessageDisplayInfo = {
            id: this.id,
            authorId: this.author.id,
            authorName: this.author.userName,
            authorPicture: this.author.picture.length ? this.author.picture : new URL('../images/user-icon.png', import.meta.url).toString(),
            authorLink: `/user/profile/${this.author.id}`,
            message: this.message ?? "",
            date: htmlUtilities.dateTimeToString(this.date),
            likes: this.likes.length ?? "0"
        };
        const attributes = { "data-messageid": this.id, "data-authorid": this.author.id };
        const thisMessageElem = htmlUtilities.createHTMLFromTemplate("tpl-forum-message", targetContainer, values, attributes, true);

        const repliesElement = thisMessageElem.querySelector(`.forum-message-replies`) as HTMLElement;
        const replyBtns = thisMessageElem.querySelector(".forum-message-buttons") as HTMLFormElement;
        const replyButton = replyBtns.querySelector(`button[value="reply"]`) as HTMLButtonElement;
        const editButton = replyBtns.querySelector(`button[value="edit"]`) as HTMLButtonElement;
        const deleteButton = replyBtns.querySelector(`button[value="delete"]`) as HTMLButtonElement;
        const likeButton = thisMessageElem.querySelector(".like-button-wrapper button") as HTMLButtonElement;
        const likeCounter = thisMessageElem.querySelector(".like-button-wrapper span") as HTMLElement;

        replyBtns.addEventListener("submit", this.onMessageButtonsSubmit.bind(this));

        // Add admin badge next to the name if the author is an admin. 
        if (this.author.admin) {
            const authorName = thisMessageElem.querySelector(".author-name span");
            if (authorName) {
                authorName.classList.add("admin");
            }
        }

        // If the user has liked this message already, make the like button reflect it.
        likeCounter.innerText = this.likes.length.toString();
        if (this.app.user && this.likes.includes(this.app.user.id)) {
            likeButton.classList.add("liked");
            likeButton.title = "Unlike this message";
        }
        else {
            likeButton.title = "Like this message";
        }

        // If a message is soft-deleted, remove hide its buttons and display it differently. 
        if (this.deleted) {
            const msgWrapper = thisMessageElem.querySelector(".forum-message-wrapper") as HTMLElement;
            if (msgWrapper) {
                msgWrapper.classList.add("deleted");
            }

            replyButton.disabled = true;
            editButton.disabled = true;
            deleteButton.disabled = true;
            likeButton.disabled = true;
            replyBtns.classList.add("hide");
        }
        // Hide buttons if the parent thread is locked (or otherwise editing is prohibited)
        else if (!allowEditing) {
            replyButton.disabled = true;
            editButton.disabled = true;
            deleteButton.disabled = true;
            likeButton.disabled = true;
            replyBtns.classList.add("hide");
        }
        // If current user is either the author of the message or admin, allow editing/deleting. 
        else if ((this.app.user && this.app.user.admin) || (this.app.user && (this.app.user.id == this.author.id))) {
            const removeButton = thisMessageElem.querySelector(".forum-message-remove") as HTMLButtonElement;

            editButton.disabled = false;
            deleteButton.disabled = false;

            if (this.app.user.admin) {
                removeButton.classList.remove("hide");
            }
        }
        else {
            editButton.disabled = true;
            deleteButton.disabled = true;
            editButton.classList.add("hide");
            deleteButton.classList.add("hide");
        }

        // TODO: Stop drawing replies at a certain depth of the reply chain, or display differently,
        // to prevent the thread view from becoming too squished. 

        if (replyDepth++ < MAX_REPLY_CHAIN_DEPTH) {
            for (const message of this.replies) {
                message.display(repliesElement, allowEditing, replyDepth);
            }
        }
        else if (this.replies.length > 0) {
            const wrapper = htmlUtilities.createHTMLElement("div", "", repliesElement, "replies-expand-wrapper");
            htmlUtilities.createHTMLElement("a", `View ${this.replies.length} more replies to this message.`, wrapper, "replies-expand-link", { href: `/message/${this.threadId}/${this.id}`, "data-navigo": "true" });
        }
        return thisMessageElem;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // If this message is currently displayed on the page, update its info to match the content
    // of this object. 
    public update(): void {
        // The post in a forum
        const updateMessage = document.querySelector(`article[data-messageid="${this.id}"].forum-message`);
        if (updateMessage) {
            console.log("Message - found Update Element!");
            const messageHTML = this.display();
            updateMessage.replaceWith(messageHTML);
        }

        // Recent activity on the profile page
        const profileMessage = document.querySelector(`article[data-messageid="${this.id}"].users-profile-post-entry`);
        if (profileMessage) {
            if (this.deleted) {
                profileMessage.remove();
            }
            else {
                const postDate = profileMessage.querySelector(".users-profile-post-date") as HTMLElement;
                const postText = profileMessage.querySelector(".users-profile-post-text") as HTMLElement;
                postDate.innerText = htmlUtilities.dateTimeToString(this.date);
                postText.innerText = this.message;
            }
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Inserts this message in the message list if the target thread is being displayed. 
    public addToThreadDisplay(threadId: string): void {
        const targetThread = document.querySelector(`section[data-threadid="${threadId}"].forum-thread`) as HTMLElement;
        if (targetThread) {
            const messageContainer = targetThread.querySelector(`.forum-thread-messages`) as HTMLElement;
            if (messageContainer) {
                const messageHTML = this.display();
                messageContainer.prepend(messageHTML);
            }
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Inserts this message into the replies list of the target/parent message if it is being displayed. 
    public addToRepliesDisplay(messageId: string): void {
        const parentMessage = document.querySelector(`article[data-messageid="${messageId}"].forum-message`);
        if (parentMessage) {
            const repliesContainer = parentMessage.querySelector(`.forum-message-replies`) as HTMLElement;
            if (repliesContainer) {
                const messageHTML = this.display();
                repliesContainer.append(messageHTML);
            }
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Inserts this message into the recent activity list of the author if their public profile is shown. 
    public async addToAuthorActivityDisplay(parentThread: Thread): Promise<void> {
        const profilePage = document.querySelector(`section[data-userid="${this.author.id}"].section-user`) as HTMLElement;
        if (profilePage) {
            const profileMessagesBox = profilePage.querySelector(`.users-profile-posts`);
            if (profileMessagesBox) {
                const postvalues = {
                    "postDate": htmlUtilities.dateTimeToString(this.date),
                    "threadTitle": parentThread.title,
                    "postLink": `/thread/${parentThread.id}`,
                    "message": htmlUtilities.getTruncatedString(this.message, 200)
                }
                const newMessage = htmlUtilities.createHTMLFromTemplate("tpl-user-posts", null, postvalues, { "data-messageid": this.id, "data-threadid": parentThread.id });
                if (newMessage) {
                    profileMessagesBox.prepend(newMessage);
                }
            }
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Toggle the Liked marker on this message for the current user. 
    public async toggleLike(): Promise<boolean> {
        try {
            const response: StatusResponseAPI = await this.app.api.updateJson(`forum/message/like/${this.id}`);

            if (response.message) {
                return (response.message == "Liked message");
            }
        }
        catch (error) {
            this.app.showError("Error toggling like on message: " + error.message);
        }
        return false;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Updates the like counter, and if the user has liked this message, if the missage is displayed 
    // on the page. 
    public updateLikesDisplay() {
        const message = document.querySelector(`article[data-messageid="${this.id}"].forum-message`);
        if (message) {
            const likeButton = message.querySelector(".like-button-wrapper button") as HTMLButtonElement;
            if (likeButton) {
                const likeCounter = message.querySelector(".like-button-wrapper span") as HTMLElement;
                likeCounter.innerText = this.likes.length.toString();

                if (this.app.user && this.likes.includes(this.app.user.id)) {
                    likeButton.classList.add("liked");
                    likeButton.title = "Unlike this message";
                }
                else {
                    likeButton.classList.remove("liked");
                    likeButton.title = "Like this message";
                }
            }
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Get the date of most recent activity on this message and any in its reply chain. 
    public getMostRecentActivityDate(): number {
        let mostRecentDate = this.date;

        function findMostRecentReply(messages: Message[]) {
            for (const msg of messages) {
                if (msg.date > mostRecentDate) {
                    mostRecentDate = msg.date;
                }
                if (msg.replies.length) {
                    findMostRecentReply(msg.replies);
                }
            }
        }

        findMostRecentReply(this.replies);
        return mostRecentDate;
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
            case "like":
                this.toggleLike();
                break;
            case "reply":
                messageTextField.value = "";
                messageDialog.showModal();
                break;
            case "edit":
                messageTextField.value = this.message;
                messageDialog.showModal();
                break;
            case "delete":
                if (confirm("Are you sure you wish to delete this message?")) {
                    this.delete();
                }
                break;
            case "remove":
                if (confirm("Are you sure you wish to permanently remove this message and all replies to it?")) {
                    this.remove();
                }
                break;
        }
    }
}

