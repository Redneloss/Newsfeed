var express  	 = require('express');
var morgan   	 = require('morgan');
var session      = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var mongoose 	 = require('mongoose');
var passport	 = require('passport');
var flash   	 = require('connect-flash');
var expressLayouts = require('express-ejs-layouts');

var app = express();
var http  = require('http').Server(app);
var port = 3000;

mongoose.connect('mongodb://localhost:27017/chat');
require('./config/passport')(passport);

app.use(morgan('dev'));
//app.use(cookieParser('brucespringsteinmegaboss'));
app.use(bodyParser());
app.use(express.static(__dirname + '/public'));
app.use(expressLayouts);

app.set('view engine', 'ejs');

app.use(session({
	secret: 'brucespringsteinmegaboss',
	resave: false,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./app/routes.js')(app, passport);
require('./app/socket.js')(http);

http.listen(port, function () {
	console.log('The magic happens on port ' + port + ' ^.^ Котик на удачу');
});