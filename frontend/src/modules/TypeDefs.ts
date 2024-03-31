


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
    postCount: number,
    lastUpdate: number,
    lastAuthor: string
}

export type ForumMessageAPI = {
    id: string,
    author: UserAuthor,
    message: string,
    deleted: boolean,
    date: number,
    replies: ForumMessageAPI[],
    likes: string[]
}

export type ForumThreadAPI = {
    id: string,
    title: string,
    date: number,
    active: boolean,
    posts: ForumMessageAPI[],
    forum?: ForumDisplayInfo
}

export type ForumAPI = {
    id: string,
    name: string,
    icon: string,
    threads: ForumThreadAPI[]
}

export type ForumMessageContextAPI = {
    message: ForumMessageAPI,
    thread: ForumThreadAPI
}

export type UserAuthor = {
    id: string,
    userName: string,
    picture: string,
    admin: boolean
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
    likes: number;
}

export type ThreadDisplayInfo = {
    title: string,
    date: string,
}

export type ForumDisplayInfo = {
    id: string,
    name: string,
    icon: string,
};

export type StatusResponseAPI = {
    message: string,
    data?: object
}

export type SocketNotificationData = {
    action: 'add' | 'edit' | 'delete' | 'like' | 'error',
    type: 'forum' | 'thread' | 'message' | 'reply' | 'user' | 'authentication' | 'error',
    data: object,
    source?: SocketNotificationSource
}

export type NotificationDataDelete = {
    id: string;
}

export type NotificationDataError = {
    status: number,
    message: string
}

export type SocketNotificationSource = {
    parent: string,
    thread?: string
}

export type ForumThreadStats = {
    postCount: number,
    lastUpdated: number,
    lastAuthor: string
}


export type APIQueryParams = Record<string, string | Array<string>> | null;
export type APIQueryValue = string | number | boolean | Array<string | number>;
export type APIQueryData = FormData | Record<string, APIQueryValue> | null;
export type APILastRequest = {
    url: URL | null,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'None',
    options: RequestInit | undefined
}
export type APIStatusResponse = {
    response: UserData,
    status: number,
    ok: boolean
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
