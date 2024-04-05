# fe23-js2-slutprojekt-sttforum
Final assignment - course Javascript 2 (FE23 Grit Academy)

## Group: STTForum
* Kamonchai Ton Wiang-in
* Kristoffer Bengtsson
* Tobias Hurtig

## Project description:
Simple discussion forum with a node.js backend. Random feature list:
* User account required to participate in forums.
* User can view a list of all forum users, and view the public profile of another user. 
* Users can edit their account details and pick a profile picture, or upload their own. 
* User can post new thread to a forum, new message in a thread and reply to existing messages.
* Hierarchical reply chains to messages where each message can have other messages as replies.
* Thread lists are sorted in falling chronological order (newest first) by activity in the thread.
* Message views are sorted in falling chronological order (recent on top) by the date of the message, or the most recent reply to a message.
* Replies to a message are sorted in ascending chronological order (oldest first) to more easily visalize reply chains.
* Users can be assigned the Admin role by other admins. 
* Admins can create new forums, edit messages written by other users, delete any message, lock/readonly-mark threads.
* Admins can edit/delete any user account, reset the profile picture of a user, and grant users Admin privileges. 
* A search functionality allows searching for text in thread titles or message text.
* Users can like messages (and then unlike previously liked messages).
* Message text can have simple formatting (bold, italics, underline) applied to parts of it.
* Any changes in the forum (new posts, edited/deleted posts, user profile changes) are reflected in real time to all connected users.

### Assignment specifics:
* Uses the Parcel bundler to build frontend client. 
* Using node.js with Express for the backend server.
* Uses Navigo.js for client side routing.
* Uses Passport.js/express-session for server side authentication and session handling. 
* Using html templates to generate client side UI elements.
* Uses websocket connection to allow client to live update changes to forums and users notified by the server. 
* Using local file storage for forum and user databases and session data. 

### Extra features (VG requirement):
* Search form
* Message Like function
* Admin functionality


## How to test
To run and test the forum locally follow these steps after cloning the repository. 

### Backend server
To set up and run the server, navigate into the "backend" directory in the terminal, then type:
```
npm install
npm start
node ./dist/index.js (or: npm run dev)
```
### Frontend/client server
To run the server serving the client frontend, navigate into the "frontend" directory in the terminal and type:
```
npm install
npm run dev
```
Then go to http://localhost:1234 in your web browser to visit the site. Click the User button in the upper left corner of the page to create a user account. 

To test admin functionality you can log in with username _Tess Testare_ and password _testare_.

## Known issue:
Occasionally express-session using session-file-store will crash with permission error on the server while trying to rename one of the session data files, similar to these issues. It happens fairly rarely and seemingly at random. Using a proper database to store session data would mitigate the issue. 
https://github.com/valery-barysok/session-file-store/issues/69
https://github.com/valery-barysok/session-file-store/issues/58
https://stackoverflow.com/questions/57745991/eperm-operation-not-permitted-rename-when-using-express-session-with-session
