/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    main.ts
    Main script for the page. Initialize the forum and handle routes/sub-pages and event
    handlers for static page elements.
*/
import ForumApp from "./modules/ForumApp";
import Message from "./modules/Message.js";
import * as htmlUtilities from "./modules/htmlUtilities.js";
import { ApiError } from "./modules/RestApi.ts";


const forumApp = new ForumApp('http://localhost:3000/api'); // https://localhost:3000/api

// Repeatedly accessed main page elements.
const pageHome = document.querySelector("#page-home") as HTMLElement;
const pageForum = document.querySelector("#page-forum") as HTMLElement;
const pageUsers = document.querySelector("#page-users") as HTMLElement;
const loginDialog = document.querySelector("#user-login") as HTMLDialogElement;

// Names of default user profile pictures.
const defaultPictureNames = ['def-pic-1.png', 'def-pic-2.png', 'def-pic-3.png'];

// Initialize the forums and load current user (if there is an active session)
forumApp.load().then(() => {
    const msgEditor = document.querySelector("#message-editor-form") as HTMLFormElement;
    if (msgEditor) {
        const formButtons = msgEditor.querySelector(".message-editor-buttons") as HTMLFormElement;
        if (formButtons) {
            formButtons.prepend(htmlUtilities.buildEditorFormatButtons(msgEditor.querySelector("textarea") as HTMLTextAreaElement));
        }
    }
}).catch((error) => {
    alert("Forum init error: " + error.message);
});


/*** ROUTES *********************************************************************/

//////////////////////////////////////////////////////////////////////////////////
// Start page - show info about the forum
forumApp.router.on("/", () => {
    pageHome.classList.add("show");
    pageForum.classList.remove("show");
    pageUsers.classList.remove("show");
});


//////////////////////////////////////////////////////////////////////////////////
// Show the forum buttons/list page
forumApp.router.on("/forums", () => {
    pageForum.classList.add("show");
    pageHome.classList.remove("show");
    pageUsers.classList.remove("show");
    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        if (isLoggedIn) {
            forumApp.showForumPicker(pageForum);
        }
        else {
            forumApp.showError(`You must be logged in to view the forums.`);
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
                forumApp.showThread(route.data.threadId, pageForum);
            }
        }
        else {
            forumApp.showError("You must be logged in to view forum threads.");
        }
    });
});


//////////////////////////////////////////////////////////////////////////////////
// Show a specified message and its replies. 
forumApp.router.on("/message/:threadId/:messageId", (route) => {
    pageForum.classList.add("show");
    pageHome.classList.remove("show");
    pageUsers.classList.remove("show");
    forumApp.userLoginCheck().then((isLoggedIn: boolean) => {
        if (isLoggedIn) {
            if (route && route.data && route.data.threadId && route.data.messageId) {
                forumApp.showMessage(route.data.threadId, route.data.messageId, pageForum);
            }
        }
        else {
            forumApp.showError("You must be logged in to view forum messages.");
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
        if (isLoggedIn) {
            forumApp.showUserList(pageUsers);
        }
        else {
            forumApp.showError("You must be logged in to view the user list.");
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
        try {
            if (isLoggedIn) {
                if (routeInfo && routeInfo.data) {
                    forumApp.showUserProfile(routeInfo.data.userid, pageUsers);
                }
                else {
                    forumApp.showError("Cannot show user profile: The user does not exist!");
                }
            }
            else {
                forumApp.showError("You must be logged in to view user profiles.");
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
    showLoginDialog();
});

forumApp.router.resolve();


/*** EVENT HANDLERS *************************************************************/

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Handler for submitting the login form 
(document.querySelector("#login-form") as HTMLFormElement).addEventListener("submit", (event) => {
    event.preventDefault();

    if ((event.submitter as HTMLButtonElement).id == "button-login") {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        forumApp.userLogin(formData.get("username") as string, formData.get("password") as string).then(() => {
            (document.querySelector("#login-username") as HTMLInputElement).value = "";
            (document.querySelector("#login-password") as HTMLInputElement).value = "";
            forumApp.router.navigate('/');
        }).catch((error) => {
            if ((error instanceof ApiError) && (error.errorCode == 401)) {
                forumApp.showError("Invalid username or password.");
            }
        });
    }
    (event.currentTarget as HTMLFormElement).reset();
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

            // These should only have a value when the user is changing their previously set picture or password. Start empty. 
            (document.querySelector("#user-profile-picture") as HTMLInputElement).value = "";
            (document.querySelector("#user-profile-password") as HTMLInputElement).value = "";
            (document.querySelector("#user-profile-password-confirm") as HTMLInputElement).value = "";

            profileDialog.showModal();
        }
        else {
            // User not logged in, show the login dialog box.
            showLoginDialog();
            toggleLoginScreen(true);
        }
    });
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Toggle between the login or register new user forms in the Login dialog box. 
(document.querySelector("#new-to-STT-button") as HTMLButtonElement).addEventListener("click", () => {
    toggleLoginScreen(false);
});

(document.querySelector("#already-have-acc-login-button") as HTMLButtonElement).addEventListener("click", () => {
    toggleLoginScreen(true);

});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// When clicking on the picture upload field on the edit user profile form, select the "custom" portrait option. 
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
            forumApp.router.navigate('/');
            pageForum.innerHTML = "";
            htmlUtilities.createHTMLElement("div", `You must be logged in to view the forums.`, pageForum, 'error-not-logged-in', null, true);
        });
    }
    // Delete account button
    else if ((event.submitter as HTMLButtonElement).id == "user-delete-submit") {
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
                forumApp.showError(`Register new user error: ${error.message}`);
            });
    }

    (event.currentTarget as HTMLFormElement).reset();
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

            if (parentMessage) {
                switch (action) {
                    case "reply": await parentMessage.newReply(formData.get("message") as string); break;
                    case "edit": await parentMessage.editMessage(formData.get("message") as string); break;
                }
            }
            else {
                forumApp.showError("Error! Could not load message to reply to.");
            }
        }
    }
    catch (error) {
        forumApp.showError(`Message error: ${error.message}`);
    }
    messageDialog.close();
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

                switch (action) {
                    case "messages": forumApp.searchMessages(searchFor, pageForum); break;
                    case "threads": forumApp.searchThreads(searchFor, pageForum); break;
                }
            }
            else {
                forumApp.showError("You must be logged in to search the forums.");
            }
        }
        catch (error) {
            forumApp.showError(`Search error: ${error.message}`);
        }
    });

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Select current text in the search box when clicking/focusing the input field.  
(document.querySelector("#search-input") as HTMLInputElement).addEventListener("focus", (event) => {
    (event.currentTarget as HTMLInputElement).select();
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Close button in error message box. 
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

        }
    });
}

//////////////////////////////////////////////////////////////////////////////////
// Switch between showing the Login or Register user forms in the Login dialog box. 
function toggleLoginScreen(showLogin: boolean): void {
    const registerForm = document.querySelector("#user-register-form") as HTMLFormElement;
    const loginForm = document.querySelector("#login-form") as HTMLFormElement;
    const regBtnContainer = document.querySelector("#register-button-container") as HTMLElement;
    const alreadyHaveAccContainer = document.querySelector("#already-have-acc-container") as HTMLElement;

    registerForm.classList[showLogin ? "add" : "remove"]("hide");
    loginForm.classList[!showLogin ? "add" : "remove"]("hide");
    regBtnContainer.classList[!showLogin ? "add" : "remove"]("hide");
    alreadyHaveAccContainer.classList[showLogin ? "add" : "remove"]("hide");
}
