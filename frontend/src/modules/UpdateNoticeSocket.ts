/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    UpdateNoticeSocket.ts
    Class for establishing a websocket connection with the server and listening on it for notifications
    about things that have been added, edited or deleted on the server and needs to be updated on the 
    client if it is currently being displayed on the page. 
*/
import ForumApp from "./ForumApp.ts";
import * as htmlUtilities from "./htmlUtilities.ts";
import Thread from "./Thread.ts";
import Message from "./Message.ts";
import {
    SocketNotificationData,
    ForumMessageAPI,
    ForumThreadAPI,
    UserAuthor,
    NotificationDataDelete,
    NotificationDataError,
    SocketNotificationSource
} from "./TypeDefs.ts";


export default class UpdateNoticeSocket {
    private app: ForumApp;
    private socketClient: WebSocket | null;
    private apiUrl: string;


    constructor(app: ForumApp, apiUrl: string) {
        this.app = app;
        this.apiUrl = apiUrl;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////
    // Establish a websocket connection with server to listen for update notices. 
    public establishSocketConnection(): void {
        const url = new URL(this.apiUrl);
        if (!this.socketClient || (this.socketClient.readyState == WebSocket.CLOSED)) {
            // Create socket connection to server
            this.socketClient = new WebSocket(`ws://${url.hostname}:${url.port}/api/updates`);
            console.log("SOCKET CONNECTION ESTABLISHED: ", `ws://${url.hostname}:${url.port}/api/updates`);

            // Listen for incoming messages on the socket
            this.socketClient.addEventListener("message", (event) => {
                if (event.data) {
                    const updateData: SocketNotificationData = JSON.parse(event.data);
                    this.processServerUpdateNotice(updateData);
                }
            });

            // Socket connection is closed, attempt to reconnect. 
            this.socketClient.addEventListener("close", (event) => {
                setTimeout(this.reEstablishSocketConnection.bind(this), 4000);
            });
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Reconnect websocket connection to server, if logged in.
    public reEstablishSocketConnection() {
        this.app.userLoginCheck().then((isLoggedIn: boolean) => {
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
    // Handle content update notices from server, updating displayed info on page if relevant. 
    private async processServerUpdateNotice(updateData: SocketNotificationData): Promise<void> {
        if (updateData.data) {
            // Something new has been added, add it to the page if the target location is displayed. 
            if (updateData.action == "add") {
                this.updateNoticeAdd(updateData);
            }
            // Something has been edited, update it on page if currently displayed. 
            else if (updateData.action == "edit") {
                this.updateNoticeEdit(updateData);
            }
            // Someone liked a message, update counter if displayed. 
            else if (updateData.action == "like") {
                if (updateData.type == "message") {
                    const theMessage = await Message.create(this.app, "", updateData.data as ForumMessageAPI);
                    if (theMessage) {
                        theMessage.updateLikesDisplay();
                    }
                }
            }
            // Something has been deleted. Remove it from the page if shown. 
            else if (updateData.action == "delete") {
                this.updateNoticeDelete(updateData);
            }
            else if (updateData.action == "error") {
                const errorInfo = updateData.data as NotificationDataError;
                if (updateData.type == "authentication") {
                    if (errorInfo.status == 401) {
                        this.app.showError(`Server connection closed: ${errorInfo.message}`);
                    }
                }
                else {
                    this.app.showError(`An error occurred: ${errorInfo.message}`);
                }
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Handle Add notifications for when a new thread, message or user has been created on server.
    // Add it to the page if its intended parent container is being displayed. 
    private async updateNoticeAdd(updateData: SocketNotificationData): Promise<void> {
        if (updateData.type == "message") {
            const parentThreadId = (updateData.source as SocketNotificationSource).parent ?? "0";
            if (parentThreadId != "0") {
                const theMessage = await Message.create(this.app, "", updateData.data as ForumMessageAPI);
                const parentThread = await Thread.create(this.app, parentThreadId);

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
                const theReply = await Message.create(this.app, "", updateData.data as ForumMessageAPI);
                const parentThread = await Thread.create(this.app, parentThreadId);

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
                const newThread = await Thread.create(this.app, "", updateData.data as ForumThreadAPI);
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


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Handle Edit notifications for when an existing thread, message or user has been changed on server. 
    // Update its information if it is currently displayed on the page. 
    private async updateNoticeEdit(updateData: SocketNotificationData): Promise<void> {
        if ((updateData.type == "message") || (updateData.type == "reply")) {
            const theMessage = await Message.create(this.app, "", updateData.data as ForumMessageAPI);
            if (theMessage) {
                theMessage.update();
            }
        }
        else if (updateData.type == "thread") {
            const theThread = await Thread.create(this.app, "", updateData.data as ForumThreadAPI);
            if (theThread) {
                theThread.update();
            }
        }
        else if (updateData.type == "user") {
            const updateUser = updateData.data as UserAuthor;
            this.updatePostsUserData(updateUser);
            this.updateProfileUserData(updateUser);

            if (this.app.user && (updateUser.id == this.app.user.id)) {
                this.app.user.userName = updateUser.userName;
                this.app.user.picture = this.app.getUserPictureUrl(updateUser.picture);
                this.app.displayCurrentUser();
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Handle Delete notifications for when a thread, message or user has been deleted on  the server. 
    // Remove it from the page if it is currently being displayed. 
    private async updateNoticeDelete(updateData: SocketNotificationData): Promise<void> {
        if ((updateData.type == "message") || (updateData.type == "reply")) {
            const parentThreadId = (updateData.source as SocketNotificationSource).thread ?? "0";
            const delMessage = updateData.data as NotificationDataDelete;
            const delForumMessage = document.querySelector(`article[data-messageid="${delMessage.id}"].forum-message`) as HTMLElement;
            const delProfileMessage = document.querySelector(`article[data-messageid="${delMessage.id}"].users-profile-post-entry`) as HTMLElement;
            const parentThread = await Thread.create(this.app, parentThreadId);

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
                    this.app.router.navigate(`/forums`);
                }
                else {
                    this.app.router.navigate(`/forum/${parentId}`);
                }
            }
        }
        else if (updateData.type == "user") {
            const delUser = updateData.data as NotificationDataDelete;
            this.deleteUserDisplayUpdate(delUser.id);
            if (this.app.user && this.app.user.id && (delUser.id == this.app.user.id)) {
                this.app.user = null;
                this.app.displayCurrentUser();
                this.app.router.navigate("/");
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
            this.app.router.navigate("/users");
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
                authorPic.src = this.app.getUserPictureUrl(userData.picture);
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

            userIcon.src = this.app.getUserPictureUrl(userData.picture);
            userIcon.alt = `${userData.userName} profile picture`;
            userName.innerText = userData.userName;
        }

        // Public user profile
        const userProfile = document.querySelector(`section[data-userid="${userData.id}"].section-user`);
        if (userProfile) {
            const userIcon = userProfile.querySelector(".users-profile-icon") as HTMLImageElement;
            const userName = userProfile.querySelector(".users-profile-name") as HTMLElement;
            const userAdmin = userProfile.querySelector(".users-profile-admin") as HTMLElement;

            userIcon.src = this.app.getUserPictureUrl(userData.picture);
            userIcon.alt = `${userData.userName} profile picture`;
            userName.innerText = userData.userName;
            userAdmin.innerText = (userData.admin ? "Admin" : "User");
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    // Insert a newly created user into the displayed user list. 
    private addToUserListDisplay(userData: UserAuthor) {
        const userList = document.querySelector(".section-user-list .user-container");
        if (userList) {
            const values = {
                "profilePic": this.app.getUserPictureUrl(userData.picture),
                "username": userData.userName,
                "userLink": "/user/profile/" + userData.id
            }
            const userCard = htmlUtilities.createHTMLFromTemplate("tpl-user-list-user", null, values, { "data-userid": userData.id });

            // Find where to insert the new user card. List should already be sorted alphabetically, so
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
}