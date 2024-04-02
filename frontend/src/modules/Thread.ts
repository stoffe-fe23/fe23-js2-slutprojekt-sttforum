/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    Thread.ts
    Class for managing a discussion thread and displaying its messages. 
*/
import Message from "./Message.ts";
import ForumApp from "./ForumApp.ts";
import * as htmlUtilities from "./htmlUtilities.ts";
import { ThreadDisplayInfo, ForumThreadAPI, ForumDisplayInfo, ForumThreadStats, StatusResponseAPI } from "./TypeDefs.ts";



export default class Thread {
    public readonly id: string;
    public title: string;
    public date: number;
    public posts: Message[];
    public active: boolean;
    public forumInfo: ForumDisplayInfo | null;
    private app: ForumApp;


    constructor(app: ForumApp, threadData: ForumThreadAPI | null = null) {
        this.app = app;
        this.posts = [];

        if (threadData) {
            this.id = threadData.id;
            this.title = threadData.title;
            this.date = threadData.date;
            this.active = (threadData.active ? true : false);
            this.forumInfo = threadData.forum ?? null;
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Factory function for creating a new Thread object from thread data fetched from the server, 
    // or a set of complete thread data in the format received from the server. 
    static async create(app: ForumApp, threadId: string, threadData: ForumThreadAPI | null = null,): Promise<Thread | null> {
        if (!threadData && threadId.length) {
            threadData = await app.api.getJson(`forum/thread/get/${threadId}`);
        }

        if (threadData) {
            const obj = new Thread(app, threadData);

            if (threadData.posts && threadData.posts.length) {
                for (const post of threadData.posts) {
                    const newMessage = await Message.create(app, "", post);
                    if (newMessage) {
                        obj.posts.push(newMessage);
                    }
                }
            }
            return obj;
        }

        return null;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Factory method creating a new thread on the server and returning the resulting new Thread object.
    static async new(app: ForumApp, targetId: string, threadTitle: string, messageText: string): Promise<Thread | null> {
        if (threadTitle.length && messageText.length) {
            const threadData = {
                title: threadTitle,
                message: messageText,
                forumId: targetId
            };

            const newThreadData: ForumThreadAPI = await app.api.postJson(`forum/thread/create`, threadData);
            return new Thread(app, newThreadData);
        }
        return null;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Generate HTML to display this discussion thread and its message content.
    public display(targetContainer: HTMLElement | null = null, displayMessage: Message | null = null): HTMLElement {
        const values: ThreadDisplayInfo = {
            title: this.title,
            date: htmlUtilities.dateTimeToString(this.date),
        };
        const attributes = { "data-threadid": this.id };

        const threadElement = htmlUtilities.createHTMLFromTemplate("tpl-forum-thread", targetContainer, values, attributes);
        const messagesElement = threadElement.querySelector(`.forum-thread-messages`) as HTMLElement;
        const newPostForm = threadElement.querySelector(`.thread-new-post-form`) as HTMLFormElement;

        // Prevent new posts if the thread is locked and show indicator. 
        if (this.active) {
            newPostForm.addEventListener("submit", this.onNewPostFormSubmit.bind(this));
            newPostForm.classList.remove("hide");
            threadElement.classList.remove("locked");
        }
        else {
            newPostForm.classList.add("hide");
            threadElement.classList.add("locked");
        }

        // Show button to edit thread if current user is an admin
        if (this.app.user && this.app.user.admin) {
            const editButton = threadElement.querySelector(".forum-thread-edit") as HTMLButtonElement;
            if (editButton) {
                editButton.classList.remove("hide");
                editButton.addEventListener("click", this.onEditThreadClick.bind(this));
            }
        }

        // Also use the dates on most recent replies to the posts in the sort order! 
        this.posts.sort((a, b) => b.getMostRecentActivityDate() - a.getMostRecentActivityDate());

        // Show posts in this thread
        if (displayMessage) {
            displayMessage.threadId = this.id;
            displayMessage.display(messagesElement, this.active);
        }
        else {
            for (const message of this.posts) {
                message.display(messagesElement, this.active);
            }
        }

        this.app.router.updatePageLinks();

        return threadElement;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Edit thread button clicked. Create form to edit thread title or delete the tread. 
    private onEditThreadClick(event) {
        const thread = document.querySelector(`section[data-threadid="${this.id}"].forum-thread`) as HTMLElement;
        if (thread) {
            console.log("DEBUG: ACTIVE IS", this.active);
            const editButton = thread.querySelector(".forum-thread-edit") as HTMLButtonElement;
            const threadTitle = thread.querySelector(".forum-thread-wrapper h3") as HTMLElement;
            const threadEditor = htmlUtilities.createHTMLFromTemplate("tpl-thread-edit", null, { title: this.title, active: this.active }, { "data-threadid": this.id });
            threadTitle.after(threadEditor);
            editButton.classList.add("hide");
            threadEditor.addEventListener("submit", this.onEditThreadSubmit.bind(this));
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Edit thread form submitted. Change the thread title or delete the thread. 
    private onEditThreadSubmit(event) {
        const editButton = document.querySelector(`section[data-threadid="${this.id}"].forum-thread .forum-thread-edit`) as HTMLButtonElement;
        const formData = new FormData(event.currentTarget);
        const newTitle = (formData.get("title") as string).trim();
        const newActive = (formData.get("active") as string) == "true" ? true : false;

        switch (event.submitter.value) {
            case "save":
                if ((newTitle != this.title) || (newActive != this.active)) {
                    this.title = newTitle;
                    this.active = newActive;
                    this.save();
                    console.log("DEBUG: Thread title edited: ", this.title);
                }
                break;
            case "delete":
                if (confirm("Are you sure you wish to delete this tread? All its messages will be permanently removed.")) {
                    this.delete();
                    console.log("DEBUG: Thread deleted!");
                }
                break;
        }

        if (editButton) {
            editButton.classList.remove("hide");
        }
        event.currentTarget.remove();
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Generate HTML for the row of this thread in a forum thread list. 
    public getThreadListEntry() {
        const stats: ForumThreadStats = this.getThreadStats();
        const values = {
            id: this.id,
            title: this.title,
            date: htmlUtilities.dateTimeToString(this.date),
            active: this.active,
            postCount: stats.postCount,
            lastUpdated: htmlUtilities.dateTimeToString(stats.lastUpdated),
            lastAuthor: stats.lastAuthor,
            link: `/thread/${this.id}`
        }
        return htmlUtilities.createHTMLFromTemplate("tpl-forum-thread-list", null, values, { "data-threadid": this.id });
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // If this message is currently displayed on the page, update its info to match the content
    // of this object. 
    public update() {
        console.log("DEBUG: Update parent thread.", this.id);
        // Thread page, displaying its messages
        const updateThread = document.querySelector(`section[data-threadid="${this.id}"].forum-thread`);
        if (updateThread) {
            const threadHTML = this.display();
            updateThread.replaceWith(threadHTML);
        }

        // Thread list of a forum
        const updateThreadList = document.querySelector(`article[data-threadid="${this.id}"].forum-thread-list`);
        if (updateThreadList) {
            const threadHTML = this.getThreadListEntry();
            updateThreadList.replaceWith(threadHTML);
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Delete this thread (and all its messages) from the forum.
    public async delete(): Promise<void> {
        try {
            const response: StatusResponseAPI = await this.app.api.deleteJson(`forum/thread/delete/${this.id}`);
            if (response.message && (response.message == "Deleted thread")) {
                alert("Thread has been deleted.");
                if (response.data) {
                    this.app.router.navigate(`/forum/${response.data}`);
                }
            }
        }
        catch (error) {
            this.app.showError(`Error deleting thread: ${error.message}`);
        }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Save info about this thread to the server
    public async save(): Promise<void> {
        try {
            const response: StatusResponseAPI = await this.app.api.updateJson(`forum/thread/edit/${this.id}`, { title: this.title, active: this.active });
            if (response.message && (response.message == "Edited thread")) {
                console.log("DEBUG: Thread title edited: " + this.title);
            }
        }
        catch (error) {
            this.app.showError(`Error deleting thread: ${error.message}`);
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Add an entry for this thread to the forum thread list of the specified forum, if it is displayed
    // on the page. 
    public addToThreadListDisplay(forumId: string): void {
        const parentForum = document.querySelector(`section[data-forumid="${forumId}"].forum`) as HTMLElement;
        if (parentForum) {
            const threadsBox = parentForum.querySelector(".forum-threads") as HTMLElement;
            if (threadsBox) {
                const threadHTML = this.getThreadListEntry();
                threadsBox.prepend(threadHTML);
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Submit handler for creating a new message in this thread. 
    private onNewPostFormSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        this.newMessage(formData.get("message") as string);
        form.reset();
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Create a new message in this thread by the currently logged in user and save it to the server. 
    public async newMessage(messageText: string): Promise<void> {
        if (this.app.isLoggedIn()) {
            const message = await Message.new(this.app, this.id, messageText);
            if (message) {
                this.posts.push(message);
            }
            else {
                throw new Error(`An error occurred when creating a new message. (${this.id})`);
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////    
    // Calculate total post count, last date updated and last user who posted in this thread. 
    public getThreadStats(): ForumThreadStats {
        let threadStats: ForumThreadStats = {
            postCount: 0,
            lastUpdated: 0,
            lastAuthor: ""
        }

        // Function to count the messages and get the date of the latest message
        function checkThreadMessages(messages: Message[]): ForumThreadStats {
            threadStats.postCount = 0;
            for (const message of messages) {
                threadStats.postCount++;
                if (message.date > threadStats.lastUpdated) {
                    threadStats.lastUpdated = message.date;
                    threadStats.lastAuthor = message.author.userName;
                }
                checkThreadReplies(message.replies);
            }

            return threadStats;
        }

        // Function to count the replies and get the date of the latest reply/message
        function checkThreadReplies(messages: Message[]): void {
            for (const message of messages) {
                threadStats.postCount++;
                if (message.date > threadStats.lastUpdated) {
                    threadStats.lastUpdated = message.date;
                    threadStats.lastAuthor = message.author.userName;
                }
                if (message.replies && message.replies.length) {
                    checkThreadReplies(message.replies);
                }
            }
        }

        return checkThreadMessages(this.posts);
    }
}