/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    TypeDefs.ts
    Type alias definitions. 
*/
import * as ws from "ws";


// Allow storing associated user id and session id on websocket object.
export interface UserWebSocket extends ws.WebSocket {
    sessionId: string;
    userId: string;
}

export type ForumMessageContext = {
    message: ForumMessage,
    thread: ForumThread
}

export type PublicUserProfilePost = {
    id: string,
    threadId: string,
    title: string,
    message: string,
    date: number;
}

export type PublicUserProfile = {
    id: string,
    userName: string,
    picture: string,
    admin: boolean,
    recentPosts: PublicUserProfilePost[],
    postCount: number
}

export type ForumUser = {
    id: string,
    name: string,
    email: string,
    picture: string,
    password: string,
    token: string | null,
    admin: boolean
}

export type UserData = {
    id: string,
    name: string,
    email: string,
    picture: string,
    admin: boolean
}

export type ForumAuthor = {
    id: string,
    userName: string,
    picture: string,
    admin: boolean
}

export type ForumThreadStats = {
    postCount: number,
    lastUpdated: number,
    lastAuthor: string
}

export type ForumMessage = {
    id: string,
    author: ForumAuthor,
    message: string,
    deleted: boolean,
    date: number,
    replies: ForumMessage[],
    likes?: string[],
    threadId?: string
}

export type ForumThread = {
    id: string,
    title: string,
    date: number,
    active: boolean,
    posts: ForumMessage[],
    forum?: ForumDisplayInfo
}

export type Forum = {
    id: string,
    name: string,
    icon: string,
    threads: ForumThread[]
}

export type ForumInfo = {
    id: string,
    name: string,
    icon: string,
    threadCount: number
}

export type ForumDisplayInfo = {
    id: string,
    name: string,
    icon: string,
};

export type ForumContentInfo = {
    id: string,
    name: string,
    icon: string,
    threads: ForumThreadInfo[]
}

export type ForumThreadInfo = {
    id: string,
    title: string,
    date: number,
    active: boolean,
    postCount: number,
    lastUpdate: number,
    lastAuthor: string
}

export type ForumMessageInfo = {
    id: string,
    author: ForumAuthor,
    message: string,
    deleted: boolean,
    date: number,
    replyCount: number
}

export type SocketNotificationData = {
    action: 'add' | 'edit' | 'delete' | 'like' | 'error',
    type: 'forum' | 'thread' | 'message' | 'reply' | 'user' | 'authentication' | 'error',
    data: object,
    source?: SocketNotificationSource
}

export type SocketNotificationSource = {
    parent: string,
    thread?: string
}