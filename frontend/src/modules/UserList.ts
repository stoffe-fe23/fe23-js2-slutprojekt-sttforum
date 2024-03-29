/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    UserList.ts
    Class for displaying user profiles and lists.
*/
import ForumApp from "./ForumApp.ts";
import { StatusResponseAPI, UserAuthor, PublicUserProfile } from "./TypeDefs.ts";
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

            this.app.router.updatePageLinks();
        }
        catch (error) {
            this.app.showError(error.message);
        }
    }
}