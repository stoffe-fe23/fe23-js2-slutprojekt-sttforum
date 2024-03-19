import Navigo from "navigo";
import ForumApp from "./modules/ForumApp";
import * as htmlUtilities from "./modules/htmlUtilities";

const router = new Navigo("/");
const forumApp = new ForumApp('http://localhost:3000');

const contentBox = document.querySelector("#page-content") as HTMLElement;

router.on("/", () => {
    console.log("NAV:", "Startsida");
    htmlUtilities.createHTMLElement("div", "Startsidan!", contentBox);
});

router.on("/forums", () => {
    console.log("NAV:", "Forum");
    htmlUtilities.createHTMLElement("div", "Forum!", contentBox);
    forumApp.showforumPicker();
});

router.on("/users", () => {
    console.log("NAV:", "Användarlista");
    htmlUtilities.createHTMLElement("div", "Användarlista!", contentBox);

});

router.on("/user/:userid", (route) => {
    console.log("NAV:", "Användarprofil", route!.data!.userid);
    htmlUtilities.createHTMLElement("div", "Användarprofil: " + route!.data!.userid, contentBox);
});

router.resolve();

