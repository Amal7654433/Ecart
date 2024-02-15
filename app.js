
var express = require('express');
require('dotenv').config();
var path = require('path');
var cookieParser = require('cookie-parser');
const session = require('express-session')
var logger = require('morgan');
const mongoose = require('mongoose');
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
const { errorHandler, err404handle } = require('./middlewares/errorHandler');
const nocache = require('nocache');
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', "ejs");
app.use(nocache());
app.use(session({ secret: process.env.SECRET_KEY, cookie: { maxAge: 6000000 }, resave: false, saveUninitialized: false }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(usersRouter)
app.use(adminRouter);

const db = process.env.MONGODB_URL

mongoose
    .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Database connected');
    })
    .catch((error) => {
        console.error('Database connection error:', error);
    });

app.use(err404handle)
app.use(errorHandler);

app.listen(process.env.PORT, () => {
    console.log("server running on", process.env.PORT);
})

module.exports = app;
