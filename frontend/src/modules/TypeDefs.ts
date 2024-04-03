/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    TypeDefs.ts
    All the new type alias definitions. 
*/


export type ForumInfoAPI = {
    id: string,
    name: string,
    icon: string,
    threadCount: number
}

// Info about a forum for the forum thread listing.
export type ForumContentInfo = {
    id: string,
    name: string,
    icon: string,
    threads: ForumThreadInfoAPI[]
}

// Info about a thread for the forum thread listing.
export type ForumThreadInfoAPI = {
    id: string,
    title: string,
    date: number,
    active: boolean,
    postCount: number,
    lastUpdate: number,
    lastAuthor: string
}

// Server response with full info about a message and its replies. 
export type ForumMessageAPI = {
    id: string,
    author: UserAuthor,
    message: string,
    deleted: boolean,
    date: number,
    replies: ForumMessageAPI[],
    likes: string[]
}

// Server response with full info about a thread and its messages. 
export type ForumThreadAPI = {
    id: string,
    title: string,
    date: number,
    active: boolean,
    posts: ForumMessageAPI[],
    forum?: ForumDisplayInfo
}

// Server response with full info about a forum and its threads.
export type ForumAPI = {
    id: string,
    name: string,
    icon: string,
    threads: ForumThreadAPI[]
}

// Server response with a forum post and the thread it belongs to. 
export type ForumMessageContextAPI = {
    message: ForumMessageAPI,
    thread: ForumThreadAPI
}

// Format for the author of a message.
export type UserAuthor = {
    id: string,
    userName: string,
    picture: string,
    admin: boolean
}

// Info for current user profile.
export type UserData = {
    id: string,
    name: string,
    email: string,
    picture: string,
    admin: boolean
}

// Basic info needed to display a message / forum post
export type MessageDisplayInfo = {
    id: string,
    authorId: string,
    authorName: string,
    authorPicture: string,
    authorLink: string,
    message: string,
    date: string;
    likes: number;
}

// Basic info needed to display a thread.
export type ThreadDisplayInfo = {
    title: string,
    date: string,
}

// Basic info needed to display a forum
export type ForumDisplayInfo = {
    id: string,
    name: string,
    icon: string,
};

// Return data of most requests in RestApi class.
export type StatusResponseAPI = {
    message: string,
    data?: object
}

// Format of an update notice broadcast over the websocket connection. 
export type SocketNotificationData = {
    action: 'add' | 'edit' | 'delete' | 'like' | 'error',
    type: 'forum' | 'thread' | 'message' | 'reply' | 'user' | 'authentication' | 'error',
    data: object,
    source?: SocketNotificationSource
}

// Data of a delete update notice. 
export type NotificationDataDelete = {
    id: string;
}

// Data of an error update notice. 
export type NotificationDataError = {
    status: number,
    message: string
}

// Source part of an update notice
export type SocketNotificationSource = {
    parent: string,
    thread?: string
}

// Statistics gathered about a thread. 
export type ForumThreadStats = {
    postCount: number,
    lastUpdated: number,
    lastAuthor: string
}


// Used by RestApi class for parameters and responses
export type APIQueryParams = Record<string, string | Array<string>> | null;
export type APIQueryValue = string | number | boolean | Array<string | number>;
export type APIQueryData = FormData | Record<string, APIQueryValue> | null;

// Used by RestApi class when keeping track of the last request made.
export type APILastRequest = {
    url: URL | null,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'None',
    options: RequestInit | undefined
}

// Used by RestApi class when tracking response of a fetch request.
export type APIStatusResponse = {
    response: UserData,
    status: number,
    ok: boolean
}

// Handling data for a message in the "most recent activity" of public user profiles
export type PublicUserProfilePost = {
    id: string,
    threadId: string,
    title: string,
    message: string,
    date: number;
}

// Handling public user profile data.
export type PublicUserProfile = {
    id: string,
    userName: string,
    picture: string,
    admin: boolean,
    recentPosts: PublicUserProfilePost[],
    postCount: number
}
