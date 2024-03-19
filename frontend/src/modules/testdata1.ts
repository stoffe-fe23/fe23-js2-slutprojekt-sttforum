import { MessageData } from "./Message.ts";


export const testMessage1: MessageData = {
    id: "1",
    author: {
        id: "1",
        userName: "John Doe",
        picture: ""
    },
    message: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    deleted: false,
    date: Date.now(),
    replies: [
        {
            id: "2",
            author: {
                id: "22",
                userName: "Jane Doe",
                picture: ""
            },
            message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            deleted: false,
            date: Date.now() + 5000,
            replies: [
                {
                    id: "3",
                    author: {
                        id: "123",
                        userName: "Tess Testare",
                        picture: ""
                    },
                    message: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                    deleted: false,
                    date: Date.now() + 20000,
                    replies: []
                },
                {
                    id: "4",
                    author: {
                        id: "456",
                        userName: "Torsten Testare",
                        picture: ""
                    },
                    message: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
                    deleted: false,
                    date: Date.now() + 80000,
                    replies: []
                }
            ]
        },
        {
            id: "5",
            author: {
                id: "789",
                userName: "Torsten Testare",
                picture: ""
            },
            message: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
            deleted: false,
            date: Date.now() + 50000,
            replies: []
        }
    ]
};


export const testMessage2 = {
    id: "6",
    author: {
        id: "1",
        userName: "John Doe",
        picture: ""
    },
    message: "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?",
    deleted: false,
    date: Date.now(),
    replies: [
        {
            id: "7",
            author: {
                id: "789",
                userName: "Torsten Testare",
                picture: ""
            },
            message: "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?",
            deleted: false,
            date: Date.now() + 50000,
            replies: []
        },
        {
            id: "8",
            author: {
                id: "22",
                userName: "Jane Doe",
                picture: ""
            },
            message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            deleted: false,
            date: Date.now() + 5000,
            replies: []
        }
    ]
};

export const testMessage3 = {
    id: "9",
    author: {
        id: "123",
        userName: "Tess Testare",
        picture: ""
    },
    message: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores.",
    deleted: false,
    date: Date.now() - 10000,
    replies: []
};