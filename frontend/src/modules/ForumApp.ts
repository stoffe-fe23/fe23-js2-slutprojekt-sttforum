/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    ForumApp.ts
    Main controller class for the Forum. Manage forums, track the logged-in user and provide interface for server requests.
*/
import Forum from "./Forum.ts";
import User from "./User.ts";
import RestApi from "./RestApi.ts";
import { ForumInfoAPI, UserData, StatusResponseAPI } from "./TypeDefs.ts";

export default class ForumApp {
    public api: RestApi;
    public user: User | null;
    public forums: Forum[];
    public mediaUrl: string;


    constructor(apiUrl: string) {
        // Object for making requests to the server/API.
        this.api = new RestApi(apiUrl);
        this.forums = [];

        const mediaUrl = new URL(apiUrl);
        this.mediaUrl = `${mediaUrl.protocol}//${mediaUrl.hostname}:${mediaUrl.port}/media/`;
    }

    public async load(): Promise<void> {
        try {
            await this.loadCurrentUser();

            if (this.isLoggedIn()) {
                return await this.loadForums();
            }
        }
        catch (error) {
            console.error("ForumApp load error: ", error.message);
        }
    }

    public async loadCurrentUser(): Promise<void> {
        // Fetch current user if logged in
        this.user = null;
        const apiResponse: StatusResponseAPI = await this.api.getJson("user/current");

        if (apiResponse.data && apiResponse.message == "User") {
            this.user = new User(this, apiResponse.data as UserData);
            this.displayCurrentUser();
            console.log("User is logged in: ", this.user.userName);
        }
        else if (apiResponse.message == "No User") {
            console.log("User not logged in.");
        }
        else {
            throw new Error("Unable to load current user data.");
        }
    }

    public async loadForums(): Promise<void> {
        try {
            const forumList: ForumInfoAPI[] = await this.api.getJson(`forum/list`);
            this.forums = [];
            if (forumList && forumList.length) {
                for (const forum of forumList) {
                    const newForum = await Forum.create(this, forum.id);
                    if (newForum) {
                        this.forums.push(newForum);
                    }
                }
            }
        }
        catch (error) {
            if (error.status) {
                if (error.status == 401) {
                    console.log("ForumApp load - Not authorized to access forums.");
                }
                else {
                    console.error("ForumApp load error: ", error.message);
                }
            }
        }
    }

    public isLoggedIn(): boolean {
        return this.user ? true : false;
    }

    public async userLogin(loginName: string, loginPass: string) {
        const postData = {
            username: loginName,
            password: loginPass
        };

        const response: StatusResponseAPI = await this.api.postJson("user/login", postData);
        if (response && response.message && (response.message == "Login successful")) {
            await this.loadCurrentUser();
            await this.loadForums();
        }
        else {
            console.log("Login failed! ", response);
        }
    }

    // Show buttons to select a forum to view
    public showforumPicker(outBox: HTMLElement): void {
        // Show buttons for all available forums
        outBox.innerHTML = "";
        if (this.isLoggedIn()) {
            for (const forum of this.forums) {
                const forumButton = forum.getButton();
                if (forumButton) {
                    outBox.appendChild(forumButton);
                    forumButton.addEventListener("click", (event) => {
                        const forumId = (event.currentTarget as HTMLButtonElement).dataset.forumid!.toString();
                        if (forumId) {
                            this.displayForum(forumId, outBox);
                        }
                    });
                }
            }
        }
        else {
            throw new Error("You must be logged in the view the forums.");
        }
    }

    // Display the threads/posts in the specified forum
    public displayForum(forumId: string, outBox: HTMLElement): void {
        if (this.isLoggedIn()) {
            const foundForum = this.forums.find((forum) => forum.id == forumId);
            if (foundForum) {
                outBox.innerHTML = "";
                foundForum.display(outBox);
            }
        }
        else {
            throw new Error("You must be logged in the view the forums.");
        }
    }

    public displayCurrentUser(): void {
        const userBox = document.querySelector("#current-user") as HTMLElement;
        const userImage = userBox.querySelector("#user-image") as HTMLImageElement;
        const userName = userBox.querySelector("#user-name") as HTMLDivElement;

        if (this.isLoggedIn() && this.user && userBox) {
            userName.innerText = this.user.userName;
            userImage.src = this.user.picture;
        }
        else {
            userName.innerText = "Log in";
            userImage.src = new URL('../images/user-icon.png', import.meta.url).toString();
        }
    }

    public async userLogoff(): Promise<void> {
        if (this.isLoggedIn()) {
            const response: StatusResponseAPI = await this.api.getJson("user/logout");
            this.user = null;
            this.displayCurrentUser();
            console.log("User logoff", response);
        }
    }

    public async userRegister(username: string, password: string, passwordConfirm: string, email: string): Promise<void> {
        if (password.length && passwordConfirm.length && (password == passwordConfirm)) {
            const newUserData = {
                username: username,
                password: password,
                email: email
            }
            const response: StatusResponseAPI = await this.api.postJson("user/register", newUserData);
            if (response && response.message && response.data) {
                // Maybe require account confirmation first? 
                // const newUser = new User(this, response.data as UserData);
                // this.user = newUser;
                console.log("User Register", response.data);
            }
        }
        else {
            throw new Error("The passwords do not match. Try again.")
        }
    }
}