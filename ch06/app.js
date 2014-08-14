var express = require("express");
var app = express();
var nodemailer = require('nodemailer');
//TODO: fix old module: https://github.com/expressjs/session
var session = require('express-session');
var MemoryStore = session.MemoryStore;

// Import the data layer
var mongoose = require('mongoose');
var config = {
    mail: require('./config/mail')
};

// Import the accounts
var Account = require('./models/Account')(config, mongoose, nodemailer);

app.configure(function () {
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/public'));
    app.use(express.limit('1mb'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({secret: "SocialNet secret key", store: new MemoryStore()}));
    mongoose.connect('mongodb://localhost/nodebackbone');
});

//Home Page
app.get('/', function (req, res) {
    res.render('index.jade');
});

//POST
app.post('/login', function (req, res) {
    console.log('login request');
    var email = req.param('email', null);
    var password = req.param('password', null);

    if (null == email || email.length < 1
        || null == password || password.length < 1) {
        res.send(400);
        return;
    }

    Account.login(email, password, function (success) {
        if (!success) {
            res.send(401);
            return;
        }
        console.log('login was successful');
        //TODO: set session variable
        req.session.loggedIn = true;
        //TODO: no return !!! how about performances ?
        res.send(200);
    });
});

//POST
app.post('/register', function (req, res) {
    var firstName = req.param('firstName', '');
    var lastName = req.param('lastName', '');
    var email = req.param('email', null);
    var password = req.param('password', null);

    //fail
    if (null == email || email.length < 1
        || null == password || password.length < 1) {
        res.send(400);
        return;
    }

    Account.register(email, password, firstName, lastName);
    //TODO: 200 means Sound
    res.send(200);
});

//GET redirect to HTTP code
app.get('/account/authenticated', function (req, res) {
    if (req.session.loggedIn) {
        res.send(200);
    } else {
        res.send(401);
    }
});

app.post('/forgotpassword', function (req, res) {
    var hostname = req.headers.host;
    var resetPasswordUrl = 'http://' + hostname + '/resetPassword';
    var email = req.param('email', null);
    if (null == email || email.length < 1) {
        res.send(400);
        return;
    }
    //TODO: send email to reset password. The page leads to /resetPassword.
    Account.forgotPassword(email, resetPasswordUrl, function (success) {
        if (success) {
            res.send(200);
        } else {
            // Username or password not found
            res.send(404);
        }
    });
});

//GET
app.get('/resetPassword', function (req, res) {
    var accountId = req.param('account', null);
    res.render('resetPassword.jade', { locals: {
        accountId: accountId
    }});
});

//POST
//TODO: is this part secure ??
app.post('/resetPassword', function (req, res) {
    var accountId = req.param('accountId', null);
    var password = req.param('password', null);
    if (null != accountId && null != password) {
        //TODO: no callback for change password, successful changes leads to console.log
        Account.changePassword(accountId, password);
    }
    res.render('resetPasswordSuccess.jade');
});

app.listen(8080);
console.log("SocialNet is listening to port 8080.");
