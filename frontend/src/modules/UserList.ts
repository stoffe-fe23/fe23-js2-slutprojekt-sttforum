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
        userPage.innerHTML = "";

        const res = await this.app.api.getJson("user/list") as StatusResponseAPI;
        const userData = res.data as UserAuthor[];
        const userListEl = htmlUtilities.createHTMLFromTemplate("tpl-user-list", userPage);
        const userContainer = userListEl.querySelector(".user-container") as HTMLElement;

        // Sort user list by name in alphabetical order
        userData.sort((a, b) => a.userName.localeCompare(b.userName));

        for (const user of userData) {
            console.log(user);
            const attribute = { "data-userid": user.id };
            const values = {
                "profilePic": (user.picture.length ? `${this.app.mediaUrl}userpictures/${user.picture}` : new URL('../images/user-icon.png', import.meta.url).toString()),
                "username": user.userName,
                "userLink": "/user/profile/" + user.id
            }
            const userElement = htmlUtilities.createHTMLFromTemplate("tpl-user-list-user", userContainer, values, attribute);
            console.log(userElement);
        }
        this.app.router.updatePageLinks();

    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Display the public profile of the user with the specified user id. 
    public async displayUserProfile(userid: string, userPage: HTMLElement): Promise<void> {
        // const userPage = document.querySelector("#page-users") as HTMLElement;
        userPage.innerHTML = "";
        const res = await this.app.api.getJson(`user/profile/${userid}`) as StatusResponseAPI;
        const userData = res.data as PublicUserProfile;

        const values = {
            "profilePic": (userData.picture.length ? `${this.app.mediaUrl}userpictures/${userData.picture}` : new URL('../images/user-icon.png', import.meta.url).toString()),
            "username": userData.userName,
            "postCounter": userData.postCount,
            "profileAdmin": userData.admin ? "Admin" : "User"
        }
        const userProfileEl = htmlUtilities.createHTMLFromTemplate("tpl-user", userPage, values);
        const postContainer = userProfileEl.querySelector(".users-profile-posts") as HTMLElement;

        if (userData.recentPosts.length) {
            for (const post of userData.recentPosts) {
                const postvalues = {
                    "postDate": htmlUtilities.dateTimeToString(post.date),
                    "threadTitle": post.title,
                    "postLink": `/thread/${post.threadId}`,
                    "message": htmlUtilities.getTruncatedString(post.message, 200)
                }
                const postrow = htmlUtilities.createHTMLFromTemplate("tpl-user-posts", postContainer, postvalues);
            }
        }
        else {
            postContainer.classList.add("no-activity");
        }

        this.app.router.updatePageLinks();
    }
}