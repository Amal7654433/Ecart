var createError = require('http-errors');
require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const session = require('express-session')
var logger = require('morgan');
const mongoose = require('mongoose');
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
const ejs = require('ejs');
const nocache = require('nocache');

const http = require('http'); // Or another HTTP library if you prefer
const cookie = require('cookie');
const catego = require('./models/categoryModel');
const prod = require('./models/adminProducts');
var app = express();


app.set('views', path.join(__dirname, 'views'));

app.set('view engine', "ejs");
app.use(nocache());
app.use(session({ secret: process.env.SECRET_KEY, cookie: { maxAge: 6000000 }, resave: false, saveUninitialized: true }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    res.locals.userIsAuthenticated = req.session.user ? true : false;
    next();
});

app.use(async (req, res, next) => {
    try {
      const cat = await catego.find({ active: true });
      res.locals.cat = cat;
      next();
    } catch (error) {
      // Handle the error as needed
      next(error);
    }
  });
app.use(async (req, res, next) => {
    try {
      const products = await prod.find({ active: true });
      res.locals.products = products;
      next();
    } catch (error) {
      // Handle the error as needed
      next(error);
    }
  });
//   app.use((req, res, next) => {

//     res.locals.goToCart=false
//     next();
//   });
  

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


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    const errStatus = err.status || 500;
    const errMessage = err.message;
    res.render('error', { errStatus, errMessage });
});
app.listen(process.env.PORT, () => {
    console.log("server running on", 7000);
})

module.exports = app;
