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
import * as htmlUtilities from "./htmlUtilities";
import {
    ForumInfoAPI,
    UserData,
    StatusResponseAPI,
    ForumMessageContextAPI,
    ForumThreadInfoAPI,
    SocketNotificationData,
    ForumMessageAPI,
    ForumThreadAPI,
    UserAuthor,
    NotificationDataDelete,
    NotificationDataError,
    SocketNotificationSource
} from "./TypeDefs.ts";

export default class ForumApp {
    public api: RestApi;
    public user: User | null;
    public router: Navigo;
    public mediaUrl: string;
    public userLoginInit: boolean;
    private socketClient: WebSocket | null;
    private apiUrl: string;


    constructor(apiUrl: string) {
        this.api = new RestApi(apiUrl);
        this.router = new Navigo("/"); // { linksSelector: "a" }
        this.userLoginInit = false;
        this.apiUrl = apiUrl;

        const mediaUrl = new URL(apiUrl);
        this.mediaUrl = `${mediaUrl.protocol}//${mediaUrl.hostname}:${mediaUrl.port}/media/`;

        this.socketClient = null;
        //        this.establishSocketConnection();
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
            this.reEstablishSocketConnection();
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
        const postData = {
            username: loginName,
            password: loginPass
        };

        const response: StatusResponseAPI = await this.api.postJson("user/login", postData);
        if (response && response.message && (response.message == "Login successful")) {
            await this.loadCurrentUser();
            //            this.reEstablishSocketConnection();
        }
        else {
            console.log("Login failed! ", response);
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
            throw new Error("The passwords do not match. Try again.")
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
                    htmlUtilities.createHTMLFromTemplate("tpl-search-result", resultsWrapper, values);
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
    // Establish a websocket connection with server to listen for update notices. 
    private establishSocketConnection(): void {
        const url = new URL(this.apiUrl);
        if (!this.socketClient || (this.socketClient.readyState == WebSocket.CLOSED)) {
            // Create socket connection to server
            this.socketClient = new WebSocket(`ws://${url.hostname}:${url.port}/api/updates`);
            console.log("SOCKET CLIENT", `ws://${url.hostname}:${url.port}/api/updates`, this.socketClient);

            // Listen for incoming messages on the socket
            this.socketClient.addEventListener("message", (event) => {
                if (event.data) {
                    const updateData: SocketNotificationData = JSON.parse(event.data);
                    this.processServerUpdateNotice(updateData);
                    console.log("SOCKET DATA: ", updateData);
                }
            });

            // Socket connection is closed, attempt to reconnect. 
            // TODO: Timeout after X number of retries... 
            this.socketClient.addEventListener("close", (event) => {
                console.log("SOCKET CLOSE: ", event);
                setTimeout(this.reEstablishSocketConnection.bind(this), 4000);
            });
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Reconnect websocket connection to server if logged in.
    private reEstablishSocketConnection() {
        this.userLoginCheck().then((isLoggedIn: boolean) => {
            if (isLoggedIn) {
                console.log("Reinitializing server connection...");
                if (this.socketClient && (this.socketClient.readyState != WebSocket.CLOSED) && (this.socketClient.readyState != WebSocket.CLOSING)) {
                    this.socketClient.close();
                }

                this.establishSocketConnection();
            }
        });

    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Handle update notice from server, updating displayed info if relevant. 
    // TODO: Break up this massive function into more digestible chunks.  
    private async processServerUpdateNotice(updateData: SocketNotificationData): Promise<void> {
        if (updateData.data) {
            // Something new has been added, add it to the page if the target location is displayed. 
            if (updateData.action == "add") {
                if (updateData.type == "message") {
                    const parentThreadId = (updateData.source as SocketNotificationSource).parent ?? "0";
                    if (parentThreadId != "0") {
                        const theMessage = await Message.create(this, "", updateData.data as ForumMessageAPI);
                        const parentThread = await Thread.create(this, parentThreadId);

                        if (parentThread && theMessage) {
                            theMessage.addToThreadDisplay(parentThreadId);
                            theMessage.addToAuthorActivityDisplay(parentThread);
                            parentThread.update();
                        }
                    }
                }
                if (updateData.type == "reply") {
                    const parentMessageId = (updateData.source as SocketNotificationSource).parent ?? "0";
                    const parentThreadId = (updateData.source as SocketNotificationSource).thread ?? "0";
                    if ((parentMessageId != "0") && (parentThreadId != "0")) {
                        const theReply = await Message.create(this, "", updateData.data as ForumMessageAPI);
                        const parentThread = await Thread.create(this, parentThreadId);

                        if (parentThread && theReply) {
                            theReply.addToRepliesDisplay(parentMessageId);
                            theReply.addToAuthorActivityDisplay(parentThread);
                            parentThread.update();
                        }
                    }
                }
                else if (updateData.type == "thread") {
                    const parentForumId = (updateData.source as SocketNotificationSource).parent ?? "0";
                    if (parentForumId != "0") {
                        const newThread = await Thread.create(this, "", updateData.data as ForumThreadAPI);
                        if (newThread) {
                            newThread.addToThreadListDisplay(parentForumId);

                            if (newThread.posts && newThread.posts.length) {
                                newThread.posts[0].addToAuthorActivityDisplay(newThread);
                            }

                            const noThreadsMsg = document.querySelector(".forum-no-threads") as HTMLElement;
                            if (noThreadsMsg) {
                                noThreadsMsg.remove();
                            }
                        }
                    }
                }
                else if (updateData.type == "user") {
                    const newUser = updateData.data as UserAuthor;
                    this.addToUserListDisplay(newUser);
                }
            }
            // Something has been edited, update it on page if currently displayed. 
            else if (updateData.action == "edit") {
                if ((updateData.type == "message") || (updateData.type == "reply")) {
                    const theMessage = await Message.create(this, "", updateData.data as ForumMessageAPI);
                    if (theMessage) {
                        theMessage.update();
                    }
                }
                else if (updateData.type == "thread") {
                    const theThread = await Thread.create(this, "", updateData.data as ForumThreadAPI);
                    if (theThread) {
                        theThread.update();
                    }
                }
                else if (updateData.type == "user") {
                    const updateUser = updateData.data as UserAuthor;
                    this.updatePostsUserData(updateUser);
                    this.updateProfileUserData(updateUser);

                    if (this.user && (updateUser.id == this.user.id)) {
                        this.user.userName = updateUser.userName;
                        this.user.picture = this.getUserPictureUrl(updateUser.picture);
                        this.displayCurrentUser();
                    }
                }
            }
            else if (updateData.action == "like") {
                if (updateData.type == "message") {
                    const theMessage = await Message.create(this, "", updateData.data as ForumMessageAPI);
                    if (theMessage) {
                        theMessage.updateLikesDisplay();
                    }
                }
            }
            // Something has been deleted. Remove it from the page if shown. 
            else if (updateData.action == "delete") {
                if ((updateData.type == "message") || (updateData.type == "reply")) {
                    const parentThreadId = (updateData.source as SocketNotificationSource).thread ?? "0";
                    const delMessage = updateData.data as NotificationDataDelete;
                    const delForumMessage = document.querySelector(`article[data-messageid="${delMessage.id}"].forum-message`) as HTMLElement;
                    const delProfileMessage = document.querySelector(`article[data-messageid="${delMessage.id}"].users-profile-post-entry`) as HTMLElement;
                    const parentThread = await Thread.create(this, parentThreadId);

                    if (delForumMessage) {
                        delForumMessage.remove();
                    }
                    if (delProfileMessage) {
                        delProfileMessage.remove();
                    }

                    if (parentThread) {
                        parentThread.update();
                    }
                }
                else if (updateData.type == "thread") {
                    const delThread = updateData.data as NotificationDataDelete;
                    const parentId = (updateData.source as SocketNotificationSource).parent ?? "0";
                    const delThreadListing = document.querySelector(`article[data-threadid="${delThread.id}"].forum-thread-list`) as HTMLElement;
                    const delThreadView = document.querySelector(`section[data-threadid="${delThread.id}"].forum-thread`) as HTMLElement;
                    if (delThreadListing) {
                        delThreadListing.remove();
                    }
                    if (delThreadView) {
                        delThreadView.remove();
                        if (parentId == "0") {
                            this.router.navigate(`/forums`);
                        }
                        else {
                            this.router.navigate(`/forum/${parentId}`);
                        }
                    }
                }
                else if (updateData.type == "user") {
                    const delUser = updateData.data as NotificationDataDelete;
                    this.deleteUserDisplayUpdate(delUser.id);
                }
            }
            else if (updateData.action == "error") {
                const errorInfo = updateData.data as NotificationDataError;
                if (updateData.type == "authentication") {
                    if (errorInfo.status == 401) {
                        this.showError(`Server connection closed: ${errorInfo.message}`);
                    }
                }
                else {
                    this.showError(`An error occurred: ${errorInfo.message}`);
                }
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Update displayed info about a user who just got absolutely deleted. 
    private deleteUserDisplayUpdate(userId: string): void {
        // Change author info on displayed posts.
        const userData: UserAuthor = {
            id: userId,
            userName: "Deleted user",
            picture: "user-icon.png",
            admin: false
        }
        this.updatePostsUserData(userData);

        // Remove from displayed user list
        const userListEntry = document.querySelector(`article[data-userid="${userData.id}"].article-user-list`);
        if (userListEntry) {
            userListEntry.remove();
        }

        // On their user profile, clear and move away
        const userProfile = document.querySelector(`section[data-userid="${userData.id}"].section-user`);
        if (userProfile) {
            userProfile.remove();
            this.router.navigate("/users");
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Update the author info of all displayed posts on the page authored by the specified user. 
    private updatePostsUserData(userData: UserAuthor) {
        const authorPosts = document.querySelectorAll(`article[data-authorid="${userData.id}"]`);
        if (authorPosts && authorPosts.length) {
            authorPosts.forEach((msg) => {
                const authorPic = msg.querySelector(".author-picture") as HTMLImageElement;
                const authorName = msg.querySelector(".author-name span") as HTMLElement;
                authorPic.src = this.getUserPictureUrl(userData.picture);
                authorPic.alt = `${userData.userName} profile picture`;
                authorName.innerText = userData.userName;
                authorName.classList[userData.admin ? "add" : "remove"]("admin");
            })
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Update displayed info about this user on the user list and public profile pages. 
    private updateProfileUserData(userData: UserAuthor) {
        // User list
        const userListEntry = document.querySelector(`article[data-userid="${userData.id}"].article-user-list`);
        if (userListEntry) {
            const userIcon = userListEntry.querySelector(".profile-icon") as HTMLImageElement;
            const userName = userListEntry.querySelector(".user-profile-name") as HTMLElement;

            userIcon.src = this.getUserPictureUrl(userData.picture);
            userIcon.alt = `${userData.userName} profile picture`;
            userName.innerText = userData.userName;
        }
        // Public user profile
        const userProfile = document.querySelector(`section[data-userid="${userData.id}"].section-user`);
        if (userProfile) {
            const userIcon = userProfile.querySelector(".users-profile-icon") as HTMLImageElement;
            const userName = userProfile.querySelector(".users-profile-name") as HTMLElement;
            const userAdmin = userProfile.querySelector(".users-profile-admin") as HTMLElement;

            userIcon.src = this.getUserPictureUrl(userData.picture);
            userIcon.alt = `${userData.userName} profile picture`;
            userName.innerText = userData.userName;
            userAdmin.innerText = (userData.admin ? "Admin" : "User");
        }
    }

    private addToUserListDisplay(userData: UserAuthor) {
        const userList = document.querySelector(".section-user-list .user-container");
        if (userList) {
            const values = {
                "profilePic": this.getUserPictureUrl(userData.picture),
                "username": userData.userName,
                "userLink": "/user/profile/" + userData.id
            }
            const userCard = htmlUtilities.createHTMLFromTemplate("tpl-user-list-user", null, values, { "data-userid": userData.id });

            // Find where to insert the new card. List should already be sorted alphabetically, so
            // just find the first user it should be inserted before. 
            for (const card of userList.children) {
                const currName = (card.querySelector(".user-profile-name") as HTMLElement).innerText;

                if (userData.userName.localeCompare(currName) < 0) {
                    userList.insertBefore(userCard, card);
                    break;
                }
            }
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
