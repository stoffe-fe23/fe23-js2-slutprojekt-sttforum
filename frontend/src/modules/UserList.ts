import ForumApp from "./ForumApp.ts";
import {StatusResponseAPI, UserAuthor} from "./TypeDefs.ts";
import * as htmlUtilities from "./htmlUtilities.ts";

export default class UserList {

    private app:ForumApp

    constructor(app:ForumApp){
        this.app = app;
    }
    public async displayUserList(){
        const userPage = document.querySelector("#page-users") as HTMLElement;
        userPage.innerHTML = "";

        const res = await this.app.api.getJson("user/list") as StatusResponseAPI;        
        const userData = res.data as UserAuthor[];
        const userListEl = htmlUtilities.createHTMLFromTemplate("tpl-user-list", userPage);
        const userContainer = userListEl.querySelector(".user-container") as HTMLElement;
        
        for(const user of userData){
            console.log(user);
            const attribute = {"data-userid": user.id};
            const values = {
                "profilePic": (user.picture.length ? `${this.app.mediaUrl}userpictures/${user.picture}` : new URL('../images/user-icon.png', import.meta.url).toString()),
                 "Username": user.userName,
                 "userLink": "/user/profile/" + user.id
                }
            const userElement = htmlUtilities.createHTMLFromTemplate("tpl-user-list-user", userContainer, values, attribute);
            console.log(userElement);
            
        }
        
    }
}