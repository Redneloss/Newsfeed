var LocalStrategy   = require('passport-local').Strategy;
var User       		= require('../app/models/user');

module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);

    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
        usernameField : 'login',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, login, password, done) {
        User.findOne({ 'login' :  login }, function(err, user) {
            if (err) {
                return done(err);
            }

            if (user) {
                return done(null, false, req.flash('signupMessage', 'That login is already taken.'));
            } else {

                var newUser = new User();
                newUser.login    = login;
                newUser.password = newUser.generateHash(password);

                newUser.save(function(err) {
                    if (err) throw err;
                    return done(null, newUser);
                });
            }

        });

    }));

    passport.use('local-login', new LocalStrategy({
        usernameField : 'login',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, login, password, done) {
        console.log('a');
        User.findOne({ 'login' :  login }, function(err, user) {
            if (err)
                return done(err);

            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.'));
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

            return done(null, user);
        });

    }));

};
