var express = require('express');
var Handlebars = require('handlebars')
var hbs = require('express-handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')
var app = express();
var port = process.env.PORT || 3000;
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var configDB = require('./config/database');
var multer = require('multer');

mongoose.connect(configDB.url, {useNewUrlParser: true, useUnifiedTopology: true});

require('./config/passport')(passport)
app.use(morgan('dev')); 
app.use(cookieParser()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


//configure Handlebars view engine
app.engine('handlebars', hbs({
    defaultLayout: 'main',
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
        isYours: function (a, b) {
          if (a == b) return true;
          return false;
        },
    }
}))
app.set('view engine', 'handlebars')

//staticdir
app.use(express.static(__dirname + '/public'))

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET',
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); 

require('./app/route')(app, passport);

app.listen(port);
console.log('The magic happens on port ' + port);