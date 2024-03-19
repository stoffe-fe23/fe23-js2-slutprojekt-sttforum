/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    ForumApp.ts
    Main controller class for the Forum. Manage forums, track the logged-in user and provide interface for server requests.
*/
import Forum from "./Forum.ts";
import User from "./User.ts";
import RestApi from "./RestApi.ts";
import { ForumInfoAPI } from "./TypeDefs.ts";

export default class ForumApp {
    public api: RestApi;
    public user: User;
    public forums: Forum[];
    public mediaUrl: string;


    constructor(apiUrl: string) {
        // Object for making requests to the server/API.
        this.api = new RestApi(apiUrl);

        const mediaUrl = new URL(apiUrl);
        this.mediaUrl = `${mediaUrl.protocol}//${mediaUrl.hostname}:${mediaUrl.port}/media/`;

        // TODO: Check if a user is logged on here before doing this, or initialize empty user.
        // Hardcode a user for testing, for now... 
        this.user = new User("f9258ea6-89c5-46b6-8577-9df9c343dc96");
    }

    public async load(): Promise<void> {
        const forumList: ForumInfoAPI[] = await this.api.getJson(`forum/list`);

        this.forums = [];
        if (forumList && forumList.length) {
            for (const forum of forumList) {
                const newForum = await Forum.create(this, forum.id);
                this.forums.push(newForum);
            }
        }
    }



    // Show buttons to select a forum to view
    public showforumPicker(outBox: HTMLElement): void {
        // Show buttons for all available forums
        outBox.innerHTML = "";

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

    // Display the threads/posts in the specified forum
    public displayForum(forumId: string, outBox: HTMLElement): void {
        const foundForum = this.forums.find((forum) => forum.id == forumId);
        if (foundForum) {
            outBox.innerHTML = "";
            foundForum.display(outBox);
        }
    }
}