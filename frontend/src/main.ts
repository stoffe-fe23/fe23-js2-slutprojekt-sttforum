/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    main.ts
    Main script for the page. Initialize the forum and handle sub-pages. 
*/

import Navigo from "navigo";
import ForumApp from "./modules/ForumApp";
import * as htmlUtilities from "./modules/htmlUtilities";

const pageRouter = new Navigo("/");
const forumApp = new ForumApp('http://localhost:3000/api');

const pageHome = document.querySelector("#page-home") as HTMLElement;
const pageForum = document.querySelector("#page-forum") as HTMLElement;
const pageUsers = document.querySelector("#page-users") as HTMLElement;

// Load available forums from the server.
forumApp.load().then(() => {
    forumApp.showforumPicker(pageForum);
    console.log("ForumApp loaded!");
});


//////////////////////////////////////////////////////////////////////////////////
// Start page - show info about the forum etc? 
pageRouter.on("/", () => {
    pageHome.classList.add("show");
    pageForum.classList.remove("show");
    pageUsers.classList.remove("show");
});


//////////////////////////////////////////////////////////////////////////////////
// Show the forum list page
pageRouter.on("/forums", () => {
    pageHome.classList.remove("show");
    pageForum.classList.add("show");
    pageUsers.classList.remove("show");
});


//////////////////////////////////////////////////////////////////////////////////
// Show a list of all the registered users
pageRouter.on("/users", () => {
    pageHome.classList.remove("show");
    pageForum.classList.remove("show");
    pageUsers.classList.add("show");
});


//////////////////////////////////////////////////////////////////////////////////
// Show the public profile for the user with the specified ID
/*
pageRouter.on("/user/:userid", (routeInfo) => {
    htmlUtilities.createHTMLElement("div", "Användarprofil: " + routeInfo!.data!.userid, contentBox);
});
*/


pageRouter.resolve();

