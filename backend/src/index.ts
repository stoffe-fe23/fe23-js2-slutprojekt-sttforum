import express from "express";
import cors from "cors";
import { isAdult } from "./util.js";

const app = express();
app.use(express.json());
app.use(cors());

app.listen(3000, () => {
    console.log('listening on port 3000: http://localhost:3000/');
})

type User = {
    name: string,
    age: number
}

app.get('/', (req, res) => {
    const newUser: User = req.body;
    if (isAdult(newUser.age))
        res.json({ message: `Welcome, ${newUser.name}` })
    else
        res.json({ message: 'Access denied' })
})