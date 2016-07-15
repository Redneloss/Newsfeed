var multer = require('multer');
var User = require('./models/user');
var Message = require('./models/message');

var upload = multer({dest: __dirname + "/../public/uploads/" });

module.exports = function(app, passport) {
	app.get('/', function(req, res) {
		if (req.isAuthenticated())
			res.render('base.ejs', {layout: 'layout.ejs', logged: true});
		else
			res.render('base.ejs', {layout: 'layout.ejs', logged: false});
	});

	app.get('/chat', isLoggedIn, function(req, res) {
		res.render('chat.ejs', {user: req.user, layout: 'layout.ejs'});
	});

	app.post('/addimage', upload.single('avatar'), function(req, res) {
		User.findOneAndUpdate({_id: req.user._id}, {$set: {avatar: "uploads/"+req.file.filename}}).exec(function(err, user){
			res.redirect("/profile");
			Message.update({"author.login": user.login}, {$set: {"author.avatar": user.avatar}}, {multi: true}).exec();
		});
	});

	app.get('/login', isLoggedOut, function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage'), layout: 'layout.ejs' });
	});

	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	app.get('/signup', isLoggedOut, function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage'),  layout: 'layout.ejs' });
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {user : req.user, layout: 'layout.ejs'});
	});

	app.get('/ratings', function(req, res) {
		res.render('ratings.ejs', {layout: 'layout.ejs'});
		console.log(req.session);
	});

	app.get('/logout', isLoggedIn, function(req, res) {
		req.logout();
		res.redirect('/');
	});
};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}

function isLoggedOut(req, res, next) {
	if (req.isAuthenticated())
		res.redirect('/');

	return next();
}

