/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    Datastore.ts
    Class for reading and writing data from the "database" JSON files. 
    Caches data from files on server startup in the forumDB and userDB properties. 
*/
import fs from 'fs/promises';
import fsync from 'fs';
import { User, Forum } from "./TypeDefs.js";


export default class DataStore {
    public forumDB: Forum[];
    public userDB: User[];
    private forumFile: string = '../backend/storage/forums.json';
    private userFile: string = '../backend/storage/users.json';

    constructor(forumFile: string = "", userFile: string = "") {
        if (forumFile.length) {
            this.forumFile = forumFile;
        }
        if (userFile.length) {
            this.userFile = userFile;
        }
        this.forumDB = [];
        this.userDB = [];
        console.log("Data storage initialized");
    }

    // Init: Load forum data (synchronous since we do not want to do anything else before this is done)
    public loadForums() {
        const forumData = fsync.readFileSync(this.forumFile);
        this.forumDB = JSON.parse(forumData.toString());
    }

    // Init: Load user data (synchronous since we do not want to do anything else before this is done)
    public loadUsers() {
        const userData = fsync.readFileSync(this.userFile);
        this.userDB = JSON.parse(userData.toString());
    }

    // Save forum data to file
    public async saveForums() {
        return await fs.writeFile(this.forumFile, JSON.stringify(this.forumDB, null, 4));
    }

    // Save forum data to file
    public async saveUsers() {
        return await fs.writeFile(this.userFile, JSON.stringify(this.userDB, null, 4));
    }
}