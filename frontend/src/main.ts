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
const forumApp = new ForumApp('http://localhost:3000');

const contentBox = document.querySelector("#page-content") as HTMLElement;


//////////////////////////////////////////////////////////////////////////////////
// Start page - show info about the forum etc? 
pageRouter.on("/", () => {
    htmlUtilities.createHTMLElement("div", "Startsidan!", contentBox);
});


//////////////////////////////////////////////////////////////////////////////////
// Show the forum list page
pageRouter.on("/forums", () => {
    forumApp.showforumPicker();
});


//////////////////////////////////////////////////////////////////////////////////
// Show a list of all the registered users
pageRouter.on("/users", () => {
    htmlUtilities.createHTMLElement("div", "Användarlista!", contentBox);

});


//////////////////////////////////////////////////////////////////////////////////
// Show the public profile for the user with the specified ID
pageRouter.on("/user/:userid", (routeInfo) => {
    htmlUtilities.createHTMLElement("div", "Användarprofil: " + routeInfo!.data!.userid, contentBox);
});


pageRouter.resolve();

