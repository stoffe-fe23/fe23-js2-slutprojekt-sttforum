/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

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
    public pictureName: string;
    public admin: boolean;
    private app: ForumApp;

    constructor(app: ForumApp, userData: UserData | null = null) {
        this.app = app;
        if (userData) {
            this.id = userData.id;
            this.userName = userData.name;
            this.email = userData.email;
            this.picture = app.getUserPictureUrl(userData.picture);
            this.pictureName = userData.picture;
            this.admin = userData.admin;
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Save changed profile data to server.
    public async updateUserProfile(profileData: FormData): Promise<void> {
        try {
            const result = await this.app.api.postFile("user/profile/update", profileData);
            this.app.userLoginInit = false;
            this.app.displayCurrentUser();
        }
        catch (error) {
            this.app.showError(`Error updating user profile: ${error.message}`)
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Delete this user from the server.
    public async deleteUser(): Promise<void> {
        try {
            const res = await this.app.api.deleteJson(`user/delete/${this.id}`);
            this.app.user = null;
            this.app.displayCurrentUser();
        }
        catch (error) {
            this.app.showError(`Error deleting user: ${error.message}`)
        }
    }

}
