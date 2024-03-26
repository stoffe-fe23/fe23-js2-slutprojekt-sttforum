import ForumApp from "./ForumApp.ts";
import {StatusResponseAPI, UserAuthor} from "./TypeDefs.ts";

export default class UserList {

    private app:ForumApp

    constructor(app:ForumApp){
        this.app = app;
    }
    public async displayUserList(){
        const res = await this.app.api.getJson("user/list") as StatusResponseAPI;
        const userData = res.data as UserAuthor[];
        console.log(userData);

        for(const user of userData){
            console.log(user);
            
        }
        
    }
}