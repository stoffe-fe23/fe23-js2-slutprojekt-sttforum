import ForumApp from "./ForumApp.ts";

export default class UserList {

    private app:ForumApp

    constructor(app:ForumApp){
        this.app = app;
    }
    public displayUserList(){
        console.log("Hej Ton");
        this.app.api.getJson("user/list").then(data => {
            console.log(data);
            
        })
    }
}