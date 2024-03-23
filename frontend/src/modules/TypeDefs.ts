


export type ForumInfoAPI = {
    id: string,
    name: string,
    icon: string,
    threadCount: number
}

export type ForumContentInfo = {
    id: string,
    name: string,
    icon: string,
    threads: ForumThreadInfoAPI[]
}

export type ForumThreadInfoAPI = {
    id: string,
    title: string,
    date: number,
    active: boolean,
    postCount: number
}

export type ForumMessageAPI = {
    id: string,
    author: UserAuthor,
    message: string,
    deleted: boolean,
    date: number,
    replies: ForumMessageAPI[]
}

export type ForumThreadAPI = {
    id: string,
    title: string,
    date: number,
    active: boolean,
    posts: ForumMessageAPI[]
}

export type ForumAPI = {
    id: string,
    name: string,
    icon: string,
    threads: ForumThreadAPI[]
}

export type UserAuthor = {
    id: string,
    userName: string,
    picture: string
}

export type UserData = {
    id: string,
    name: string,
    email: string,
    picture: string,
    admin: boolean
}

export type MessageDisplayInfo = {
    id: string,
    authorId: string,
    authorName: string,
    authorPicture: string,
    authorLink: string,
    message: string,
    date: string;
}

export type ThreadDisplayInfo = {
    title: string,
    date: string,
}

export type ForumDisplayInfo = {
    name: string,
    icon: string,
};

export type StatusResponseAPI = {
    message: string,
    data?: object
}