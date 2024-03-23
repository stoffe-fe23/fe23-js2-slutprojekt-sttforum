/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    ForumApp.ts
    Main controller class for the Forum. Manage forums, track the logged-in user and provide interface for server requests.
*/
import Navigo from "navigo";
import Forum from "./Forum.ts";
import Thread from "./Thread.ts";
import Message from "./Message.ts";
import User from "./User.ts";
import RestApi from "./RestApi.ts";
import { ForumInfoAPI, UserData, StatusResponseAPI } from "./TypeDefs.ts";
import * as htmlUtilities from "./htmlUtilities";

export default class ForumApp {
    public api: RestApi;
    public user: User | null;
    public router: Navigo;
    // public forums: Forum[];
    public mediaUrl: string;
    private userLoginInit: boolean;


    constructor(apiUrl: string) {
        // Object for making requests to the server/API.
        this.api = new RestApi(apiUrl);
        this.router = new Navigo("/");
        this.userLoginInit = false;
        // this.forums = [];

        const mediaUrl = new URL(apiUrl);
        this.mediaUrl = `${mediaUrl.protocol}//${mediaUrl.hostname}:${mediaUrl.port}/media/`;
    }

    public async load(): Promise<void> {
        try {
            await this.loadCurrentUser();

            /*             if (this.isLoggedIn()) {
                            return await this.loadForums();
                        } */
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
            this.userLoginInit = true;
            this.displayCurrentUser();
            console.log("User is logged in: ", this.user.userName);
        }
        else if (apiResponse.message == "No User") {
            console.log("User not logged in.");
            this.userLoginInit = true;
        }
        else {
            throw new Error("Unable to load current user data.");
        }
    }

    /*     public async loadForums(): Promise<void> {
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
        } */

    // Show buttons to select a forum to view
    public async showForumPicker(outBox: HTMLElement): Promise<void> {
        // Show buttons for all available forums
        outBox.innerHTML = "";
        if (this.isLoggedIn()) {
            const forumList: ForumInfoAPI[] = await this.api.getJson(`forum/list`);
            // this.forums = [];
            if (forumList && forumList.length) {
                for (const forum of forumList) {
                    const forumData = {
                        id: forum.id,
                        name: forum.name,
                        icon: forum.icon.length ? this.mediaUrl + 'forumicons/' + forum.icon : new URL('../images/forum-icon.png', import.meta.url).toString(),
                        threadCount: forum.threadCount
                    }
                    const forumButton = htmlUtilities.createHTMLFromTemplate("tpl-forum-button", outBox, forumData, { "data-forumid": forum.id });

                    forumButton.addEventListener("click", (event) => {
                        const button = event.currentTarget as HTMLButtonElement;
                        if (button && button.dataset && button.dataset.forumid) {
                            // TODO: Redirect instead to /forum/<id>
                            this.router.navigate(`/forum/${button.dataset.forumid}`);
                        }
                    });
                }
            }

            /*
           //     id: forum.id,
           //     name: forum.name,
           //     icon: forum.icon,
           //     threadCount: forum.threads.length

            for (const forum of this.forums) {
                const forumButton = forum.getButton();
                if (forumButton) {
                    outBox.appendChild(forumButton);
                    forumButton.addEventListener("click", (event) => {
                        const button = event.currentTarget as HTMLButtonElement;
                        if (button && button.dataset && button.dataset.forumid) {
                            // TODO: Redirect instead to /forum/<id>
                            this.displayForum(button.dataset.forumid, outBox);
                        }

                    });
                }
            }
            */
        }
        else {
            throw new Error("You must be logged in the view the forums.");
        }
    }

    // Display the threads/posts in the specified forum
    /*     public displayForum(forumId: string, outBox: HTMLElement): void {
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
        } */

    // Display the threads/posts in the specified forum
    public async showForum(forumId: string, outBox: HTMLElement): Promise<void> {
        if (this.isLoggedIn()) {
            // const foundForum = this.forums.find((forum) => forum.id == forumId);
            const foundForum = await Forum.create(this, forumId);
            if (foundForum) {
                outBox.innerHTML = "";
                foundForum.display(outBox);
            }
        }
        else {
            throw new Error("You must be logged in the view the forum topics.");
        }
    }

    // Display the posts in the specified thread
    public async showThread(threadId: string, outBox: HTMLElement): Promise<void> {
        if (this.isLoggedIn()) {
            const foundThread = await Thread.create(this, threadId);
            if (foundThread) {
                outBox.innerHTML = "";
                foundThread.display(outBox);
            }
        }
        else {
            throw new Error("You must be logged in the view forum posts.");
        }
    }

    public displayCurrentUser(): void {
        const userBox = document.querySelector("#current-user") as HTMLElement;
        const userImage = userBox.querySelector("#user-image") as HTMLImageElement;
        const userName = userBox.querySelector("#user-name") as HTMLDivElement;

        if (this.isLoggedIn() && this.user && userBox) {
            userName.innerText = this.user.userName ?? "Username";
            userImage.src = this.user.picture;
        }
        else {
            userName.innerText = "Log in";
            userImage.src = new URL('../images/user-icon.png', import.meta.url).toString();
        }
    }

    public isLoggedIn(): boolean {
        return this.user ? true : false;
    }

    public async userLoginCheck(): Promise<boolean> {
        if (!this.user && !this.userLoginInit) {
            await this.loadCurrentUser();
        }
        return this.isLoggedIn();
    }

    // TODO: Need exception handling here
    // 401 - login invalid (user,pass is wrong, user does not exist etc)
    public async userLogin(loginName: string, loginPass: string): Promise<void> {
        const postData = {
            username: loginName,
            password: loginPass
        };

        const response: StatusResponseAPI = await this.api.postJson("user/login", postData);
        if (response && response.message && (response.message == "Login successful")) {
            await this.loadCurrentUser();
            //await this.loadForums();
        }
        else {
            console.log("Login failed! ", response);
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
                // Maybe require account confirmation first before allowing full access? 
                console.log("User Register", response.data);
            }
        }
        else {
            throw new Error("The passwords do not match. Try again.")
        }
    }

    public async updateUserProfile(profileData: FormData): Promise<void> {
        const result = await this.api.postFile("user/profile/update", profileData);
        console.log("Profile update");
        this.displayCurrentUser();
        // TODO: Update authorinfo on client-cached messages? 
    }

    // Find the message with the specified message ID
    /*     public findForumContentById(contentId: string): Forum | Thread | Message | null {
            let foundMsg: Message | undefined;
            for (const forum of this.forums) {
                if (forum.id === contentId) {
                    return forum;
                }
                for (const thread of forum.threads) {
                    if (thread.id === contentId) {
                        return thread;
                    }
                    foundMsg = this.messageSearch(contentId, thread.posts);
                    if (foundMsg) {
                        return foundMsg;
                    }
                }
            }
            return null;
        } */

    // Helper method to recursively search reply chains for a matching message ID.
    /*     private messageSearch(messageId: string, messages: Message[]): Message | undefined {
            for (const message of messages) {
                if (message.id === messageId) {
                    return message;
                }
                else if (message.replies && message.replies.length) {
                    const result = this.messageSearch(messageId, message.replies);
                    if (result) {
                        return result;
                    }
                }
            }
        } */
}