/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    main.ts
    Main script for the page. Initialize the forum and handle sub-pages. 
*/
import ForumApp from "./modules/ForumApp";
import Message from "./modules/Message.js";
import * as htmlUtilities from "./modules/htmlUtilities.js";
import { ApiError } from "./modules/RestApi.ts";


const forumApp = new ForumApp('http://localhost:3000/api'); // https://localhost:3000/api

const pageHome = document.querySelector("#page-home") as HTMLElement;
const pageForum = document.querySelector("#page-forum") as HTMLElement;
const pageUsers = document.querySelector("#page-users") as HTMLElement;
const loginDialog = document.querySelector("#user-login") as HTMLDialogElement;

export const defaultPictureNames = ['def-pic-1.png', 'def-pic-2.png', 'def-pic-3.png'];

console.log("PAGE LOADED!", htmlUtilities.dateTimeToString(Date.now()));

// Initialize the forums and load current user (if already logged in)
forumApp.load().then(() => {
    console.log("DEBUG: ForumApp loaded!");
}).catch((error) => {
    alert("Forum init error: " + error.message);
});


/*** ROUTES *********************************************************************/

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
        if (isLoggedIn) {
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

        if (isLoggedIn) {
            forumApp.showUserList(pageUsers);
        }
        else {
            console.log("DEBUG: User not logged on, not allowed to view user list.");
        }

    });
});


//////////////////////////////////////////////////////////////////////////////////
// Show the public profile for the user with the specified ID
forumApp.router.on("/user/profile/:userid", (routeInfo) => {
    pageHome.classList.remove("show");
    pageForum.classList.remove("show");
    pageUsers.classList.add("show");

    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        console.log("DEBUG: Show public user profile!");
        try {
            if (isLoggedIn) {
                if (routeInfo && routeInfo.data) {
                    forumApp.showUserProfile(routeInfo.data.userid, pageUsers);
                }
                else {
                    console.log("DEBUG: No User ID specified, cannot show profile.")
                }
            }
            else {
                console.log("DEBUG: User not logged on, not permitted to view user profiles.")
            }
        }
        catch (error) {
            forumApp.showError(error.message);
        }
    });
});


//////////////////////////////////////////////////////////////////////////////////
// Route to directly display the user login dialog box.
// Used for links in messages, clicking the User button in upper left does the same
// but does not use this route. 
forumApp.router.on("/login", () => {
    console.log("DEBUG: Show login screen!");
    showLoginDialog();
});


/*** EVENT HANDLERS *************************************************************/

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Handler for submitting the login form 
(document.querySelector("#login-form") as HTMLFormElement).addEventListener("submit", (event) => {
    event.preventDefault();

    if ((event.submitter as HTMLButtonElement).id == "button-login") {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        forumApp.userLogin(formData.get("username") as string, formData.get("password") as string).then(() => {
            console.log("DEBUG: User Login");
            (document.querySelector("#login-username") as HTMLInputElement).value = "";
            (document.querySelector("#login-password") as HTMLInputElement).value = "";
            forumApp.router.navigate('/');
        }).catch((error) => {
            if ((error instanceof ApiError) && (error.errorCode == 401)) {
                console.log("DEBUG: login error", error);
                forumApp.showError("Invalid username or password.");
            }
        });
    }
    loginDialog.close();
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Handler for clicking on the User button in the top left corner.
// Show user profile form if logged in, or the login form if not. 
(document.querySelector("#current-user") as HTMLElement).addEventListener("click", (event) => {
    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        if (isLoggedIn && forumApp.user) {
            const profileDialog = document.querySelector("#user-profile") as HTMLDialogElement;
            const customImage = document.querySelector(`#def-pic-container label[for="def-pic-custom"] img`) as HTMLImageElement;

            // Load current user info into the form fields. 
            (document.querySelector("#user-profile-name") as HTMLInputElement).value = forumApp.user.userName;
            (document.querySelector("#user-profile-email") as HTMLInputElement).value = forumApp.user.email;
            (document.querySelector("#user-profile-picture-view") as HTMLImageElement).src = forumApp.user.picture;
            customImage.src = forumApp.getUserPictureUrl("");

            if (defaultPictureNames.includes(forumApp.user.pictureName)) {
                const selectedPic = document.querySelector(`#def-pic-container input[name="defaultPicture"][value="${forumApp.user.pictureName}"]`) as HTMLInputElement;
                if (selectedPic) {
                    selectedPic.checked = true;
                }
            }
            else {
                const selectedPic = document.querySelector(`#def-pic-container input[name="defaultPicture"][value="custom"]`) as HTMLInputElement;
                if (selectedPic) {
                    customImage.src = forumApp.user.picture;
                    selectedPic.checked = true;
                }
            }

            // These should only have a value when changing what is already set. 
            (document.querySelector("#user-profile-picture") as HTMLInputElement).value = "";
            (document.querySelector("#user-profile-password") as HTMLInputElement).value = "";
            (document.querySelector("#user-profile-password-confirm") as HTMLInputElement).value = "";

            profileDialog.showModal();
        }
        else {
            // User not logged in, show the login dialog box. 
            showLoginDialog();
        }
    });
});

///// Ton \\\\\
(document.querySelector("#register-button") as HTMLButtonElement).addEventListener("click", () => {
    const registerForm = document.querySelector("#user-register-form") as HTMLFormElement;
    const loginForm = document.querySelector("#login-form") as HTMLFormElement;
    const regBtnContainer = document.querySelector("#register-button-container") as HTMLElement;
    const alreadyHaveAccContainer = document.querySelector("#already-have-acc-container") as HTMLElement;

    registerForm.classList.remove("hide");
    loginForm.classList.add("hide");
    regBtnContainer.classList.add("hide");
    alreadyHaveAccContainer.classList.remove("hide");
});

(document.querySelector("#already-have-acc-login-btn") as HTMLButtonElement).addEventListener("click", () => {
    const loginForm = document.querySelector("#login-form") as HTMLFormElement;
    const registerForm = document.querySelector("#user-register-form") as HTMLFormElement;
    const regBtnContainer = document.querySelector("#register-button-container") as HTMLElement;
    const alreadyHaveAccContainer = document.querySelector("#already-have-acc-container") as HTMLElement;


    loginForm.classList.remove("hide");
    registerForm.classList.add("hide");
    regBtnContainer.classList.remove("hide");
    alreadyHaveAccContainer.classList.add("hide");
    
    
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// When clicking on the picture upload field on the user profile, select the "custom" portrait option. 
(document.querySelector("#user-profile-picture") as HTMLInputElement).addEventListener("click", (event) => {
    (document.querySelector("#def-pic-custom") as HTMLInputElement).checked = true;
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Submit handler for edit user profile form
(document.querySelector("#user-profile-form") as HTMLFormElement).addEventListener("submit", (event) => {
    event.preventDefault();
    const profileDialog = document.querySelector("#user-profile") as HTMLDialogElement;

    // Update profile button
    if ((event.submitter as HTMLButtonElement).id == "user-profile-submit") {
        forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
            if (isLoggedIn && forumApp.user) {
                const formData = new FormData(event.currentTarget as HTMLFormElement);
                forumApp.user.updateUserProfile(formData);

            }
        });
    }
    // Log off button
    else if ((event.submitter as HTMLButtonElement).id == "user-profile-logout") {
        forumApp.userLogoff().then(() => {
            console.log("DEBUG: User logged off!");
            forumApp.router.navigate('/');
            pageForum.innerHTML = "";
            htmlUtilities.createHTMLElement("div", `You must be <a href="/login" data-navigo>logged in</a> to view the forums.`, pageForum, 'error-not-logged-in', null, true);
        });
    }
    // Delete account button
    else if ((event.submitter as HTMLButtonElement).id == "user-delete-submit") {
        console.log("DEBUG: User Delete!!!");
        forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
            if (isLoggedIn) {
                if (confirm("Are you sure you wish to delete your user account?")) {
                    if (confirm("Are you REALLY sure you want to remove your account? This cannot be undone.")) {
                        if (forumApp.user) {
                            forumApp.user.deleteUser().then(() => {
                                alert("Your user account has been deleted.");
                                forumApp.router.navigate("/");
                            });
                        }
                    }
                }
            }
        });
    }

    profileDialog.close();
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
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
            formData.get("email") as string)
            .then(() => {
                alert("User account created!");
                showLoginDialog();

            }).catch((error) => {
                console.error("Login error", error.message);

            });
    }
    ///// Ton \\\\\
    else if ((event.submitter as HTMLButtonElement).id == "user-register-cancel") {
        console.log("Hej Ton");
        console.log((event.submitter as HTMLButtonElement).id);
    }
    loginDialog.close();
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Submit handler for the message editor form. Used to create replies to messages, and edit existing messages. 
(document.querySelector("#message-editor-form") as HTMLFormElement).addEventListener("submit", async (event) => {
    event.preventDefault();

    const messageDialog = document.querySelector("#message-editor-dialog") as HTMLDialogElement;
    try {
        if ((event.submitter as HTMLButtonElement).value == "save") {
            const formData = new FormData(event.currentTarget as HTMLFormElement, event.submitter);
            const action = formData.get("action");
            const targetId = formData.get("targetId") as string;
            const parentMessage = await Message.create(forumApp, targetId);

            console.log("DEBUG: Message Editor submit: ", action, targetId);

            if (parentMessage) {
                switch (action) {
                    case "reply": await parentMessage.newReply(formData.get("message") as string); break;
                    case "edit": await parentMessage.editMessage(formData.get("message") as string); break;
                }
            }
            else {
                console.log("Error! Could not load message to reply to.");
            }
        }
        messageDialog.close();
    }
    catch (error) {
        console.error("DEBUG: Error submitting from message editor", error.message);
        forumApp.showError(`Message error: ${error.message}`);
        messageDialog.close();
    }
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Search form submit
(document.querySelector("#searchform") as HTMLFormElement).addEventListener("submit", async (event) => {
    event.preventDefault();

    pageForum.classList.add("show");
    pageHome.classList.remove("show");
    pageUsers.classList.remove("show");

    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        try {
            if (isLoggedIn) {
                const formData = new FormData(event.currentTarget as HTMLFormElement, event.submitter);
                const action = formData.get("searchType") as string;
                const searchFor = formData.get("searchFor") as string;

                console.log("DEBUG: Forum Search: ", action, searchFor);
                switch (action) {
                    case "messages": forumApp.searchMessages(searchFor, pageForum); break;
                    case "threads": forumApp.searchThreads(searchFor, pageForum); break;
                }
            }
            else {
                console.log("DEBUG: Not logged in, cannot search the forums.");
            }
        }
        catch (error) {
            console.error("DEBUG: Error during forum search.", error.message);
        }
    });
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Close button in error message
(document.querySelector("#error button") as HTMLButtonElement).addEventListener("click", (event) => {
    (document.querySelector("#error") as HTMLElement).classList.remove("show");
});



/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Handler for the admin form to create a new forum. 
(document.querySelector("#forum-editor-form") as HTMLFormElement).addEventListener("submit", (event) => {
    event.preventDefault();

    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        if (isLoggedIn && forumApp.user && forumApp.user.admin) {
            if ((event.submitter as HTMLButtonElement).value == "save") {
                const formData = new FormData(event.currentTarget as HTMLFormElement);
                forumApp.createForum(formData).catch(forumApp.showError);
                (event.currentTarget as HTMLFormElement).classList.add("hide");
                forumApp.router.navigate("/forums");
            }
        }
        else {
            forumApp.showError("You must have administrator permissions to add a new forum.");
        }
    });
});


/*** FUNCTIONS ******************************************************************/

//////////////////////////////////////////////////////////////////////////////////
// Display the login form popup dialog. 
function showLoginDialog() {
    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        if (!isLoggedIn) {
            (document.querySelector("#login-username") as HTMLInputElement).value = "";
            (document.querySelector("#login-password") as HTMLInputElement).value = "";

            (document.querySelector("#user-register-form") as HTMLFormElement).classList.add("hide");
            (document.querySelector("#login-form") as HTMLFormElement).classList.remove("hide");
            (document.querySelector("#register-button-container") as HTMLElement).classList.remove("hide");

            loginDialog.showModal();
                  ///// Ton \\\\\
                  const loginForm = document.querySelector("#login-form") as HTMLFormElement;
                  const registerForm = document.querySelector("#user-register-form") as HTMLFormElement;
                  const regBtnContainer = document.querySelector("#register-button-container") as HTMLElement;
                  const alreadyHaveAccContainer = document.querySelector("#already-have-acc-container") as HTMLElement;
      
                  alreadyHaveAccContainer.classList.add("hide");
                  registerForm.classList.add("hide");

                  regBtnContainer.classList.remove("hide");
                  loginForm.classList.remove("hide");
        }
    });
}



forumApp.router.resolve();

