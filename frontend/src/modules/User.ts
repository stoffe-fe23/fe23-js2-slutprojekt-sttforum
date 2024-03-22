/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    User.ts
    Class for managing the currently logged-in user and displaying/editing their profile. 
*/
import ForumApp from "./ForumApp";
import { UserData } from "./TypeDefs";

export default class User {
    public readonly id: string;
    public userName: string;
    public email: string;
    public picture: string;
    public admin: boolean;
    private app: ForumApp;

    constructor(app: ForumApp, userData: UserData | null = null) {
        this.app = app;
        if (userData) {
            this.id = userData.id;
            this.userName = userData.name;
            this.email = userData.email;
            this.picture = (userData.picture.length ? `${this.app.mediaUrl}userpictures/${userData.picture}` : new URL('../images/user-icon.png', import.meta.url).toString());
            this.admin = userData.admin;
        }
    }
    // mediaUrl
    // TODO: Methods for viewing and editing the user profile

    // TODO: Methods for logging on/off, and checking if logged in
}
