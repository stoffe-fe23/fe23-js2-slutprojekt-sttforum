/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    UserList.ts
    Class for displaying user profiles and lists.
*/
import ForumApp from "./ForumApp.ts";
import { StatusResponseAPI, UserAuthor, UserData, PublicUserProfile } from "./TypeDefs.ts";
import * as htmlUtilities from "./htmlUtilities.ts";


export default class UserList {
    private app: ForumApp;


    constructor(app: ForumApp) {
        this.app = app;
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Display a list of all registered users on the forum (name, picture + profile link)
    public async displayUserList(userPage: HTMLElement): Promise<void> {
        // const userPage = document.querySelector("#page-users") as HTMLElement;
        try {
            userPage.innerHTML = "";

            const res = await this.app.api.getJson("user/list") as StatusResponseAPI;
            const userData = res.data as UserAuthor[];
            const userListEl = htmlUtilities.createHTMLFromTemplate("tpl-user-list", userPage);
            const userContainer = userListEl.querySelector(".user-container") as HTMLElement;

            // Sort user list by name in alphabetical order
            userData.sort((a, b) => a.userName.localeCompare(b.userName));

            for (const user of userData) {
                const attribute = { "data-userid": user.id };
                const values = {
                    "profilePic": this.app.getUserPictureUrl(user.picture),
                    "username": user.userName,
                    "userLink": "/user/profile/" + user.id
                }
                htmlUtilities.createHTMLFromTemplate("tpl-user-list-user", userContainer, values, attribute);
            }
            this.app.router.updatePageLinks();
        }
        catch (error) {
            this.app.showError(error.message);
        }

    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Display the public profile of the user with the specified user id. 
    public async displayUserProfile(userid: string, userPage: HTMLElement): Promise<void> {
        // const userPage = document.querySelector("#page-users") as HTMLElement;
        try {
            userPage.innerHTML = "";
            try {
                const res = await this.app.api.getJson(`user/profile/${userid}`) as StatusResponseAPI;
                const userData = res.data as PublicUserProfile;

                const values = {
                    "profilePic": this.app.getUserPictureUrl(userData.picture),
                    "username": userData.userName,
                    "postCounter": userData.postCount,
                    "profileAdmin": userData.admin ? "Admin" : "User"
                }
                const userProfileEl = htmlUtilities.createHTMLFromTemplate("tpl-user", userPage, values, { "data-userid": userData.id });
                const postContainer = userProfileEl.querySelector(".users-profile-posts") as HTMLElement;

                if (userData.recentPosts.length) {
                    for (const post of userData.recentPosts) {
                        const postvalues = {
                            "postDate": htmlUtilities.dateTimeToString(post.date),
                            "threadTitle": post.title,
                            "postLink": `/thread/${post.threadId}`,
                            "message": htmlUtilities.getTruncatedString(post.message, 200)
                        }
                        const postrow = htmlUtilities.createHTMLFromTemplate("tpl-user-posts", postContainer, postvalues, { "data-messageid": post.id, "data-threadid": post.threadId });
                    }
                }
                else {
                    postContainer.classList.add("no-activity");
                }

                // Load user editor form if current user is an admin.
                if (this.app.user && this.app.user.admin) {
                    try {
                        const response = await this.app.api.getJson(`user/admin/profile/${userid}`) as StatusResponseAPI;
                        const userAdminData = response.data as UserData;
                        const userEditor = htmlUtilities.createHTMLFromTemplate("tpl-user-admin-edit", userPage, userAdminData, { "data-userid": userid });
                        const userEditorForm = userEditor.querySelector("#users-profile-edit") as HTMLFormElement;
                        userEditorForm.addEventListener("submit", this.onAdminUserEditorSubmit.bind(this));
                    }
                    catch (error) {
                        this.app.showError(`Error loading user editor: ${error.message}`);
                    }
                }
            }
            catch (error) {
                this.app.showError(`Error loading user profile: ${error.message}`);
            }

            this.app.router.updatePageLinks();
        }
        catch (error) {
            this.app.showError(error.message);
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Submit handler for the admin form to edit the profile of a user account.
    private async onAdminUserEditorSubmit(event) {
        event.preventDefault();
        try {
            const form = event.currentTarget as HTMLFormElement;
            const button = event.submitter as HTMLButtonElement;
            if (form) {
                console.log("SUBMIT!", form);
                const userId = form.dataset.userid;
                if (userId && userId.length && (userId != "0")) {
                    if (button.value == "save") {
                        const formData = new FormData(form);
                        const response = await this.app.api.postJson(`user/admin/profile/update/${userId}`, formData) as StatusResponseAPI;
                        if (response && response.data && response.message && (response.message == "User profile updated.")) {
                            this.app.showUserProfile(userId, document.querySelector("#page-users") as HTMLElement);
                        }
                        else if (response && response.error) {
                            this.app.showError(`Edit user error: ${response.error}`);
                        }
                    }
                    else if (button.value == "delete") {
                        if (confirm("Are  you sure you want to permanently delete this user account?")) {
                            const response = await this.app.api.deleteJson(`user/delete/${userId}`) as StatusResponseAPI;
                            if (response && response.data && response.message && (response.message == "User deleted")) {
                                this.app.router.navigate("/users");
                            }
                            else if (response && response.error) {
                                this.app.showError(`Delete user error: ${response.error}`);
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            this.app.showError(`Error editing user: ${error.message}`);
        }
    }
}