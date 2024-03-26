


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
    replies: ForumMessageAPI[]
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

// Used by RestApi class

// Parameters when doing an API request
export type APIQueryParams = Record<string, string | Array<string>> | null;

// Data passed to the API functions when doing a non-GET request
export type APIQueryValue = string | number | boolean | Array<string | number>;
export type APIQueryData = FormData | Record<string, APIQueryValue> | null;

// Tracking info about the last API query performed
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
