/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : TTSForum

    TypeDefs.ts
    Type alias definitions. 
*/

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
    picture: string
}

export type ForumMessage = {
    id: string,
    author: ForumAuthor,
    message: string,
    deleted: boolean,
    date: number,
    replies: ForumMessage[]
}

export type ForumThread = {
    id: string,
    title: string,
    date: number,
    active: boolean,
    posts: ForumMessage[]
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

export type ForumThreadInfo = {
    id: string,
    title: string,
    date: number,
    active: boolean,
    postCount: number
}

export type ForumMessageInfo = {
    id: string,
    author: ForumAuthor,
    message: string,
    deleted: boolean,
    date: number,
    replyCount: number
}
