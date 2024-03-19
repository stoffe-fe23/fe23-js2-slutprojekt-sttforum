/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    ForumApp.ts
    Main controller class for the Forum. Manage forums, track the logged-in user and provide interface for server requests.
*/
import Forum from "./Forum.ts";
import User from "./User.ts";
import RestApi from "./RestApi.ts";

export default class ForumApp {
    public api: RestApi;
    public user: User;
    public forums: Forum[];


    constructor(apiUrl: string) {
        // Object for making requests to the server/API.
        this.api = new RestApi(apiUrl);

        // TODO: Check if a user is logged on here before doing this, or initialize empty user.
        this.user = new User("1");

        // TODO: Load available forums from the server.
        this.forums = [];

        // Hardcoded dummy forum for testing. Remove. 
        const testForum = new Forum(this, "1");
        this.forums.push(testForum);

        console.log("ForumApp Init!");
    }


    // Show buttons to select a forum to view
    public showforumPicker(): void {
        // TODO: Show list (or buttons with icons?) of all available forums
        const outBox = document.querySelector("#page-content") as HTMLElement;
        outBox.innerHTML = "";

        for (const forum of this.forums) {
            const forumButton = forum.getButton();
            if (forumButton) {
                outBox.appendChild(forumButton);
                forumButton.addEventListener("click", (event) => {
                    const forumId = (event.currentTarget as HTMLButtonElement).dataset.forumid!.toString();
                    if (forumId) {
                        this.displayForum(forumId);
                    }
                });
            }
        }
    }

    // Display the threads/posts in the specified forum
    public displayForum(forumId: string): void {
        const outBox = document.querySelector("#page-content") as HTMLElement;
        const foundForum = this.forums.find((forum) => forum.id == forumId);
        if (foundForum) {
            outBox.innerHTML = "";
            foundForum.display(outBox);
        }
    }
}