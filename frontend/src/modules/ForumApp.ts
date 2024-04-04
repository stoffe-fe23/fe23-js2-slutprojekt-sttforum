/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    ForumApp.ts
    Main controller class for the Forum. Manage forums, track the logged-in user and provide interface for server requests.
*/
import Navigo from "navigo";
import Forum from "./Forum.ts";
import Thread from "./Thread.ts";
import Message from "./Message.ts";
import User from "./User.ts";
import RestApi from "./RestApi.ts";
import UserList from "./UserList.ts";
import UpdateNoticeSocket from "./UpdateNoticeSocket.ts";
import * as htmlUtilities from "./htmlUtilities";
import {
    ForumInfoAPI,
    UserData,
    StatusResponseAPI,
    ForumMessageContextAPI,
    ForumThreadInfoAPI,
} from "./TypeDefs.ts";

export default class ForumApp {
    public api: RestApi;
    public user: User | null;
    public router: Navigo;
    public mediaUrl: string;
    public userLoginInit: boolean;
    private serverUpdates: UpdateNoticeSocket;
    private apiUrl: string;


    constructor(apiUrl: string) {
        // Handle all fetch requests to server via the api object.
        this.api = new RestApi(apiUrl);
        this.apiUrl = apiUrl;

        // Client side routing
        this.router = new Navigo("/"); // { linksSelector: "a" }

        // Track if check for an active user session has been made. 
        this.userLoginInit = false;

        // Location on server of uploaded profile pictures and forum icons
        const mediaUrl = new URL(apiUrl);
        this.mediaUrl = `${mediaUrl.protocol}//${mediaUrl.hostname}:${mediaUrl.port}/media/`;

        // Listen for notices from server that something has changed and update the page accordingly.
        // Init, actual connection is established in the loadCurrentUser() method. 
        this.serverUpdates = new UpdateNoticeSocket(this, apiUrl);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////
    // Initialization of the forum app. 
    public async load(): Promise<void> {
        try {
            await this.loadCurrentUser();
        }
        catch (error) {
            console.error("ForumApp load error: ", error.message);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Check if a user is currently logged in, and fetch their user data from the server.
    public async loadCurrentUser(): Promise<void> {
        this.user = null;
        const apiResponse: StatusResponseAPI = await this.api.getJson("user/current");
        console.log("DEBUG: Load current user info.")

        if (apiResponse.data && apiResponse.message == "User") {
            this.user = new User(this, apiResponse.data as UserData);
            this.userLoginInit = true;
            this.displayCurrentUser();
            this.serverUpdates.establishSocketConnection();
            console.log("DEBUG: User is logged in: ", this.user.userName);
        }
        else if (apiResponse.message == "No User") {
            console.log("DEBUG: User not logged in.");
            this.userLoginInit = true;
        }
        else {
            throw new Error("Unable to load current user data.");
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Forum picker screen: Display buttons to select a forum to view
    public async showForumPicker(outBox: HTMLElement): Promise<void> {
        // Show buttons for all available forums
        outBox.innerHTML = "";

        htmlUtilities.createHTMLElement("h2", "Forums", outBox, "forumlist-title");
        const forumButtonWrapper = htmlUtilities.createHTMLElement("div", "", outBox, "forumlist-forums");

        const forumList: ForumInfoAPI[] = await this.api.getJson(`forum/list`);
        if (forumList && forumList.length) {
            forumList.sort((a: ForumInfoAPI, b: ForumInfoAPI) => a.name.localeCompare(b.name));
            for (const forum of forumList) {
                const forumData = {
                    id: forum.id,
                    name: forum.name,
                    icon: forum.icon.length ? this.mediaUrl + 'forumicons/' + forum.icon : new URL('../images/forum-icon.png', import.meta.url).toString(),
                    threadCount: forum.threadCount
                }
                const forumButton = htmlUtilities.createHTMLFromTemplate("tpl-forum-button", forumButtonWrapper, forumData, { "data-forumid": forum.id });

                forumButton.addEventListener("click", (event) => {
                    const button = event.currentTarget as HTMLButtonElement;
                    if (button && button.dataset && button.dataset.forumid) {
                        this.router.navigate(`/forum/${button.dataset.forumid}`);
                    }
                });
            }
        }

        if (this.user && this.user.admin) {
            const adminLinkWrapper = htmlUtilities.createHTMLElement("div", "", outBox, "admin-new-forum-wrapper");
            const newForumButton = htmlUtilities.createHTMLElement("button", "Create new forum", adminLinkWrapper, "admin-new-forum-link");
            newForumButton.addEventListener("click", (event) => {
                const editorButton = event.currentTarget as HTMLButtonElement;
                const forumEditorForm = document.querySelector("#forum-editor-form") as HTMLFormElement;
                if (editorButton.classList.contains("expanded")) {
                    forumEditorForm.classList.add("hide");
                    editorButton.classList.remove("expanded");
                }
                else {
                    forumEditorForm.classList.remove("hide");
                    editorButton.classList.add("expanded");
                }
                forumEditorForm.reset();
            });
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Display a list of the threads in the specified forum.
    public async showForum(forumId: string, outBox: HTMLElement): Promise<void> {
        // const foundForum = this.forums.find((forum) => forum.id == forumId);
        const foundForum = await Forum.create(this, forumId);
        if (foundForum) {
            outBox.innerHTML = "";
            foundForum.display(outBox);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Display all the posts/replies in the specified thread
    public async showThread(threadId: string, outBox: HTMLElement): Promise<void> {

        const foundThread = await Thread.create(this, threadId);
        if (foundThread) {
            outBox.innerHTML = "";

            // Display the thread within its parent forum wrapper. 
            if (foundThread.forumInfo) {
                foundThread.forumInfo.icon = foundThread.forumInfo.icon.length ? this.mediaUrl + 'forumicons/' + foundThread.forumInfo.icon : new URL('../images/forum-icon.png', import.meta.url).toString()

                const forumElement = htmlUtilities.createHTMLFromTemplate("tpl-thread-forum", outBox, foundThread.forumInfo, { "data-forumid": foundThread.forumInfo.id });
                const threadsElement = forumElement.querySelector(`.forum-thread`) as HTMLElement;

                foundThread.display(threadsElement);

                const breadcrumb = forumElement.querySelector(".forum-breadcrumb") as HTMLElement;
                if (breadcrumb) {
                    htmlUtilities.createHTMLElement("a", "Forums", breadcrumb, "breadcrumb-link", { href: `/forums`, "data-navigo": "true" });
                    htmlUtilities.createHTMLElement("a", foundThread.forumInfo.name, breadcrumb, "breadcrumb-link", { href: `/forum/${foundThread.forumInfo.id}`, "data-navigo": "true" });
                    htmlUtilities.createHTMLElement("a", foundThread.title, breadcrumb, "breadcrumb-link", { href: `/thread/${foundThread.id}`, "data-navigo": "true" });
                    this.router.updatePageLinks();
                }
            }
            else {
                // If the thread for some reason is not in a forum, just display it on its own. 
                foundThread.display(outBox);
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////
    // Display all the posts/replies in the specified thread
    public async showMessage(threadId: string, messageId: string, outBox: HTMLElement): Promise<void> {

        const parentThread = await Thread.create(this, threadId);
        if (parentThread) {
            outBox.innerHTML = "";

            // Display the thread within its parent forum wrapper. 
            if (parentThread.forumInfo) {
                parentThread.forumInfo.icon = parentThread.forumInfo.icon.length ? this.mediaUrl + 'forumicons/' + parentThread.forumInfo.icon : new URL('../images/forum-icon.png', import.meta.url).toString()

                const forumElement = htmlUtilities.createHTMLFromTemplate("tpl-thread-forum", outBox, parentThread.forumInfo, { "data-forumid": parentThread.forumInfo.id });
                const threadsElement = forumElement.querySelector(`.forum-thread`) as HTMLElement;
                const displayMessage = await Message.create(this, messageId);

                if (displayMessage) {
                    displayMessage.threadId = threadId;
                    parentThread.display(threadsElement, displayMessage);
                }

                const breadcrumb = forumElement.querySelector(".forum-breadcrumb") as HTMLElement;
                if (breadcrumb) {
                    htmlUtilities.createHTMLElement("a", "Forums", breadcrumb, "breadcrumb-link", { href: `/forums`, "data-navigo": "true" });
                    htmlUtilities.createHTMLElement("a", parentThread.forumInfo.name, breadcrumb, "breadcrumb-link", { href: `/forum/${parentThread.forumInfo.id}`, "data-navigo": "true" });
                    htmlUtilities.createHTMLElement("a", parentThread.title, breadcrumb, "breadcrumb-link", { href: `/thread/${parentThread.id}`, "data-navigo": "true" });
                    htmlUtilities.createHTMLElement("a", "Message", breadcrumb, "breadcrumb-link", { href: `/message/${parentThread.id}/${messageId}`, "data-navigo": "true" });
                    this.router.updatePageLinks();
                }
            }
        }

    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Update the current user display on the page (icon + name in the upper left)
    public displayCurrentUser(): void {
        const userBox = document.querySelector("#current-user") as HTMLElement;
        const userImage = userBox.querySelector("#user-image") as HTMLImageElement;
        const userName = userBox.querySelector("#user-name") as HTMLDivElement;

        this.userLoginCheck().then((isLoggedIn: boolean) => {
            console.log("DEBUG: Update current user display.");
            if (isLoggedIn && this.user && userBox) {
                userName.innerText = this.user.userName ?? "Username";
                userImage.src = this.user.picture;
            }
            else {
                userName.innerText = "Log in";
                userImage.src = this.getUserPictureUrl("");
            }
        });

    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Check if the current user is logged in.
    // Use userLoginCheck() instead unless sure the current user data is already loaded. 
    public isLoggedIn(): boolean {
        return this.user ? true : false;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Async wrapper for checking if the user is logged in, allowing time for user data
    // from server to load before the check is made and something is done with the user. 
    public async userLoginCheck(): Promise<boolean> {
        if (!this.user && !this.userLoginInit) {
            await this.loadCurrentUser();
        }
        return this.isLoggedIn();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////
    // Attempt to log in to the server with the specified username and password. 
    // TODO: Need exception handling here
    // 401 - login invalid (user,pass is wrong, user does not exist etc)
    public async userLogin(loginName: string, loginPass: string): Promise<void> {
        try {
            const postData = {
                username: loginName,
                password: loginPass
            };

            const response: StatusResponseAPI = await this.api.postJson("user/login", postData);
            if (response && response.message && (response.message == "Login successful")) {
                await this.loadCurrentUser();
            }
            else {
                console.log("Login failed! ", response);
            }
        }
        catch (error) {
            this.showError(`Login error: ${error.message}`);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Log off from the server. 
    public async userLogoff(): Promise<void> {
        if (this.isLoggedIn()) {
            const response: StatusResponseAPI = await this.api.getJson("user/logout");
            this.user = null;
            this.displayCurrentUser();
            console.log("DEBUG: User logoff", response);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Register a new user account on the server. 
    // TODO: Need exception/validation handling here
    public async userRegister(username: string, password: string, passwordConfirm: string, email: string): Promise<void> {
        if (password.length && passwordConfirm.length && (password == passwordConfirm)) {
            const newUserData = {
                username: username,
                password: password,
                email: email
            }
            const response: StatusResponseAPI = await this.api.postJson("user/register", newUserData);
            if (response && response.message && response.data) {
                // Maybe require account confirmation first before allowing full access? 
                console.log("DEBUG: User Register", response.data);
            }
        }
        else {
            throw new Error("The passwords do not match. Try again.");
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Display a list of all registered users.
    public showUserList(userPage: HTMLElement): void {
        const userList = new UserList(this);
        userList.displayUserList(userPage);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Displays the public profile of the user with the specified user ID. 
    public showUserProfile(userId: string, userPage: HTMLElement): void {
        const userList = new UserList(this);
        userList.displayUserProfile(userId, userPage).catch((error) => {
            this.showError(error.message);
        });
    }

    /*
    
    */
    ////////////////////////////////////////////////////////////////////////////////////////////
    // Search forums for message text.
    public async searchMessages(searchForText: string, resultsTarget: HTMLElement): Promise<void> {
        const response = await this.api.postJson("forum/search/messages", { searchFor: searchForText }) as StatusResponseAPI;
        console.log("DEBUG: Message search result", response);
        if (response && response.data) {
            const results = response.data as ForumMessageContextAPI[];

            resultsTarget.innerHTML = "";
            htmlUtilities.createHTMLElement("h2", "Search results", resultsTarget, "search-title");
            const resultsWrapper = htmlUtilities.createHTMLElement("div", "", resultsTarget, "search-results");

            if (results.length) {
                for (const result of results) {
                    const values = {
                        threadLink: `/thread/${result.thread.id}`,
                        threadTitle: result.thread.title,
                        messageDate: htmlUtilities.dateTimeToString(result.message.date),
                        messageText: htmlUtilities.getTruncatedString(result.message.message, 200)
                    }
                    const resultRow = htmlUtilities.createHTMLFromTemplate("tpl-search-result", resultsWrapper, values);
                    // Allow whitelisted HTML tags in message text.
                    const messageTextElem = resultRow.querySelector(".search-result-text") as HTMLElement;
                    messageTextElem.innerHTML = "";
                    htmlUtilities.setContentWithTagFilter(values.messageText, messageTextElem, ['b', 'i', 'u', 'a', 'blockquote'], ['href']);
                }
            }
            else {
                htmlUtilities.createHTMLElement("div", "No messages match your search.", resultsTarget, "search-noresults");
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Search forums for thread topics.
    public async searchThreads(searchForText: string, resultsTarget: HTMLElement): Promise<void> {
        const response = await this.api.postJson("forum/search/threads", { searchFor: searchForText }) as StatusResponseAPI;
        console.log("DEBUG: Thread search result", response);
        if (response && response.data) {
            const results = response.data as ForumThreadInfoAPI[];

            resultsTarget.innerHTML = "";
            htmlUtilities.createHTMLElement("h2", "Search results", resultsTarget, "search-title");
            const resultsWrapper = htmlUtilities.createHTMLElement("div", "", resultsTarget, "search-results");

            if (results.length) {
                for (const result of results) {
                    const values = {
                        threadLink: `/thread/${result.id}`,
                        threadTitle: result.title,
                        threadDate: htmlUtilities.dateTimeToString(result.lastUpdate),
                        threadLastBy: result.lastAuthor
                    }
                    htmlUtilities.createHTMLFromTemplate("tpl-search-result-thread", resultsWrapper, values);
                }
            }
            else {
                htmlUtilities.createHTMLElement("div", "No thread topics match your search.", resultsTarget, "search-noresults");
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Display error messages to the user
    public showError(errorText: string) {
        const errorDiv = document.querySelector("#error") as HTMLElement;
        const errorMsg = errorDiv.querySelector("#error-message") as HTMLElement;

        errorMsg.innerHTML = errorText;
        errorDiv.classList.add("show");
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Add a new forum to the server. 
    public async createForum(forumData: FormData) {
        try {
            const result = await this.api.postFile("forum/create", forumData);
            if (result) {
                this.router.navigate("/forums");
            }
        }
        catch (error) {
            this.showError(error.message);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Get a full URL to the user profile picture specified. 
    public getUserPictureUrl(pictureName: string) {
        if (pictureName && (pictureName.length > 4)) {
            return `${this.mediaUrl}userpictures/${pictureName}`;
        }
        return new URL('../images/user-icon.png', import.meta.url).toString();
    }
}
