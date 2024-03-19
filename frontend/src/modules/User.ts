/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    User.ts
    Class for managing the currently logged-in user and displaying/editing their profile. 
*/

export default class User {
    public readonly id: string;
    public userName: string;
    public picture: string;

    constructor(userId: string) {
        // TODO: Load user profile data from the server...
        // Dummy test data
        this.id = userId;
        this.userName = "John Doe";
        this.picture = "./images/user-icon.png";
    }

    // TODO: Methods for viewing and editing the user profile

    // TODO: Methods for logging on/off, and checking if logged in
}
