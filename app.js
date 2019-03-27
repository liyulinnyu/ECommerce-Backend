const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const graphqlHttp = require('express-graphql');
const buildSchema = require('graphql');
const graphqlSchema = require('../server/graphql/schema/index');
const graphqlResolver = require('../server/graphql/resolver/index');
const jsonwebtoken = require('jsonwebtoken');

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use((req, res, next) => {
    const authHeader = req.get('Authorization');
    console.log(authHeader);
    if (!authHeader) {
        req.isAuth = false;
        return next();
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        req.isAuth = false;
        return next();
    }
    try {
        let myToken = jsonwebtoken.verify(token, 'AuthKey');
        req.isAuth = true;
        req.userId = myToken.userId;
        console.log('here');
        next();
    } catch (err) {
        req.isAuth = false;
        return next();
    }
});

app.use('/graphql', graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true
}));

mongoose.connect(`
    mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-zh2w7.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`)
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log('server is running..');
        })
    }).catch(err => (new Error(err)));

