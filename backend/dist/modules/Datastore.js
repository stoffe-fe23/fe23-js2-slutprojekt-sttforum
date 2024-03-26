/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    Datastore.ts
    "Fake database".
    Class for reading and writing data from the JSON files in the "storage" folder.
    Forum posts and users are kept in separate files.
    Caches data from files on server startup in the forumDB and userDB properties for quicker access.
    The data in these properties are then manipulated, and the whole structure saved to the file.
*/
import fs from 'fs/promises';
import fsync from 'fs';
export default class DataStore {
    constructor(forumFile = "", userFile = "") {
        this.forumFile = '../backend/storage/forums.json';
        this.userFile = '../backend/storage/users.json';
        if (forumFile.length) {
            this.forumFile = forumFile;
        }
        if (userFile.length) {
            this.userFile = userFile;
        }
        this.forumDB = [];
        this.userDB = [];
    }
    ////////////////////////////////////////////////////////////////////////////////////
    // Init: Load forum data 
    // (synchronous since we do not want to do anything else before this is done)
    loadForums() {
        const forumData = fsync.readFileSync(this.forumFile);
        this.forumDB = JSON.parse(forumData.toString());
    }
    ////////////////////////////////////////////////////////////////////////////////////
    // Init: Load user data 
    // (synchronous since we do not want to do anything else before this is done)
    loadUsers() {
        const userData = fsync.readFileSync(this.userFile);
        this.userDB = JSON.parse(userData.toString());
    }
    ////////////////////////////////////////////////////////////////////////////////////
    // Save cached forum data to file
    async saveForums() {
        return await fs.writeFile(this.forumFile, JSON.stringify(this.forumDB, null, 4));
    }
    ////////////////////////////////////////////////////////////////////////////////////
    // Save cached user data to file
    async saveUsers() {
        return await fs.writeFile(this.userFile, JSON.stringify(this.userDB, null, 4));
    }
}
