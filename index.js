const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extented: true }));


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2vlh5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// --------------------------------------

async function run() {
    try {
        await client.connect();
        const usersCollection = client.db("heroRider").collection("users");

        // Add
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log('got new user', user);
            console.log('added user', result);
            res.json(result);
        });
        // upsert user
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })
        // make admin


        // Get users
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const services = await cursor.toArray();
            res.send(services);
        });
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        // Cancel User
        app.delete('/deleteOrder/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);

            console.log('deleting user with id ', result);

            res.json(result);
        })
        // Mark user
        app.put('/approveOrder/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: "marked"
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            console.log('updating', id)
            res.json(result)
        })

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


// ---------------------------------------

app.get('/', (req, res) => {
    res.send('Hero-rider server is running');
});

app.listen(port, () => {
    console.log('Server running at port', port);
})