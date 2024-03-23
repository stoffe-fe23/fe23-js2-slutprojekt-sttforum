/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    main.ts
    Main script for the page. Initialize the forum and handle sub-pages. 
*/
import ForumApp from "./modules/ForumApp";
import * as htmlUtilities from "./modules/htmlUtilities.js";


const forumApp = new ForumApp('http://localhost:3000/api');

const pageHome = document.querySelector("#page-home") as HTMLElement;
const pageForum = document.querySelector("#page-forum") as HTMLElement;
const pageUsers = document.querySelector("#page-users") as HTMLElement;
const loginDialog = document.querySelector("#user-login") as HTMLDialogElement;


console.log("PAGE LOADED!");

// Handler for submitting the login form 
(document.querySelector("#login-form") as HTMLFormElement).addEventListener("submit", (event) => {
    event.preventDefault();
    console.log("Login form submit");
    if ((event.submitter as HTMLButtonElement).id == "button-login") {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        forumApp.userLogin(formData.get("username") as string, formData.get("password") as string).then(() => {
            console.log("Login");
            // forumApp.showforumPicker(pageForum);
            (document.querySelector("#login-username") as HTMLInputElement).value = "";
            (document.querySelector("#login-password") as HTMLInputElement).value = "";
            forumApp.router.navigate('/forums');

            alert("Logged in.")

        }).catch((error) => {
            console.error("Login error", error.message);

        });
    }
    loginDialog.close();
});

// Handler for clicking on the User button in the top left corner
// TODO: Clean this up... a lot. 
(document.querySelector("#current-user") as HTMLElement).addEventListener("click", (event) => {
    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        if (isLoggedIn && forumApp.user) {
            const profileDialog = document.querySelector("#user-profile") as HTMLDialogElement;
            const nameField = document.querySelector("#user-profile-name") as HTMLInputElement;
            const emailField = document.querySelector("#user-profile-email") as HTMLInputElement;
            const pictureField = document.querySelector("#user-profile-picture") as HTMLInputElement;
            const passwordField = document.querySelector("#user-profile-password") as HTMLInputElement;
            const passwordConfirmField = document.querySelector("#user-profile-password-confirm") as HTMLInputElement;
            const pictureView = document.querySelector("#user-profile-picture-view") as HTMLImageElement;

            nameField.value = forumApp.user.userName;
            emailField.value = forumApp.user.email;
            pictureField.value = "";
            passwordField.value = "";
            passwordConfirmField.value = "";
            pictureView.src = forumApp.user.picture;

            profileDialog.showModal();
        }
        else {
            showLoginDialog();
        }
    });
});

// Submit handler for edit user profile form
(document.querySelector("#user-profile-form") as HTMLFormElement).addEventListener("submit", (event) => {
    event.preventDefault();
    const profileDialog = document.querySelector("#user-profile") as HTMLDialogElement;
    if ((event.submitter as HTMLButtonElement).id == "user-profile-submit") {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        forumApp.updateUserProfile(formData);
    }
    else if ((event.submitter as HTMLButtonElement).id == "user-profile-logout") {
        forumApp.userLogoff().then(() => {
            console.log("User logged off!");
            forumApp.router.navigate('/');
            pageForum.innerHTML = "";
            htmlUtilities.createHTMLElement("div", `You must be <a href="/login" data-navigo>logged in</a> to view the forums.`, pageForum, 'error-not-logged-in', null, true);
        });
    }

    profileDialog.close();
});

// New user registration form submit
(document.querySelector("#user-register-form") as HTMLFormElement).addEventListener("submit", (event) => {
    event.preventDefault();
    console.log("Register form submit");
    if ((event.submitter as HTMLButtonElement).id == "user-register-submit") {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        forumApp.userRegister(
            formData.get("username") as string,
            formData.get("password") as string,
            formData.get("password-confirm") as string,
            formData.get("email") as string).then(() => {
                console.log("Login");
                alert("User account created!");
                forumApp.router.navigate('/login');

            }).catch((error) => {
                console.error("Login error", error.message);

            });
    }
    loginDialog.close();
});


// Initialize the forums and load current user (if already logged in)
forumApp.load().then(() => {
    /*     if (forumApp.isLoggedIn()) {
            forumApp.showforumPicker(pageForum);
        }
        else {
            htmlUtilities.createHTMLElement("div", `You must be <a href="/login" data-navigo>logged in</a> to view the forums.`, pageForum, 'error-not-logged-in', null, true);
        } */
    console.log("ForumApp loaded!");
}).catch((error) => {
    alert(error.message);
});


//////////////////////////////////////////////////////////////////////////////////
// Start page - show info about the forum etc? 
forumApp.router.on("/", () => {
    pageHome.classList.add("show");
    pageForum.classList.remove("show");
    pageUsers.classList.remove("show");
    console.log("DEBUG: Show start page!");
});


//////////////////////////////////////////////////////////////////////////////////
// Show the forum list page
forumApp.router.on("/forums", () => {
    pageForum.classList.add("show");
    pageHome.classList.remove("show");
    pageUsers.classList.remove("show");
    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        console.log("DEBUG: Show forum buttons!");
        if (isLoggedIn) {
            forumApp.showForumPicker(pageForum);
        }
        else {
            htmlUtilities.createHTMLElement("div", `You must be <a href="/login" data-navigo>logged in</a> to view the forums.`, pageForum, 'error-not-logged-in', null, true);
        }
    });
});

//////////////////////////////////////////////////////////////////////////////////
// Show the list of threads in a forum.
forumApp.router.on('/forum/:forumId', (route) => {
    pageForum.classList.add("show");
    pageHome.classList.remove("show");
    pageUsers.classList.remove("show");
    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        console.log("DEBUG: Show Forum threads!");

        if (isLoggedIn) {
            if (route && route.data && route.data.forumId) {
                forumApp.showForum(route.data.forumId, pageForum);
            }
        }
    });
});

//////////////////////////////////////////////////////////////////////////////////
// Show the posts in a discussion thread. 
forumApp.router.on("/thread/:threadId", (route) => {
    pageForum.classList.add("show");
    pageHome.classList.remove("show");
    pageUsers.classList.remove("show");
    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        console.log("DEBUG: Show Forum Thread messages!");

        if (isLoggedIn) {
            console.log("DEBUG: Show threads running...");
            if (route && route.data && route.data.threadId) {
                console.log("DEBUG: Show threads displaying: ", route.data.threadId);
                forumApp.showThread(route.data.threadId, pageForum);
            }
        }
        else {
            console.log("DEBUG: Show threads skipped, no login..");
        }
    });
});



//////////////////////////////////////////////////////////////////////////////////
// Show a list of all the registered users
forumApp.router.on("/users", () => {
    pageHome.classList.remove("show");
    pageForum.classList.remove("show");
    pageUsers.classList.add("show");
    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        console.log("DEBUG: Show user list!");
    });
});

//////////////////////////////////////////////////////////////////////////////////
// Show a list of all the registered users
forumApp.router.on("/login", () => {
    console.log("DEBUG: Show login screen!");
    showLoginDialog();
});



//////////////////////////////////////////////////////////////////////////////////
// Show the public profile for the user with the specified ID

forumApp.router.on("/user/profile/:userid", (routeInfo) => {
    console.log("DEBUG: Show public user profile!");
    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        htmlUtilities.createHTMLElement("div", "Användarprofil: " + routeInfo!.data!.userid, pageForum);
    });
});



forumApp.router.resolve();


function showLoginDialog() {
    if (!forumApp.isLoggedIn()) {
        (document.querySelector("#login-username") as HTMLInputElement).value = "";
        (document.querySelector("#login-password") as HTMLInputElement).value = "";
        loginDialog.showModal();
    }

}
