var LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var User = require('../app/models/user');

module.exports = function (passport) {
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use(new GoogleStrategy({
        clientID: "824457943607-6la5k8vvqhq5c9670if24qa57p2e9p7f.apps.googleusercontent.com",
        clientSecret: "gOCV84AQR3pQz_g13mOLRbo4",
        callbackURL: "https://moodada.herokuapp.com/auth/google/callback"
      },
      async(accessToken, refreshToken, profile, done) => {
        const authId = 'google:' + profile.id;
        const domain = profile._json.hd;
        if(domain === "student.tdtu.edu.vn") {
            await User.findOne({ 'student.authId': authId })
            .then(user => {
            if(user) return done(null, user); else {
                var newUser = new User();
                newUser.student.authId = authId;
                newUser.student.name = profile.displayName;
                newUser.student.email = profile.emails[0].value;
                newUser.student.created = new Date();
                newUser.role = 'student';
                newUser.student.faculty = 'empty';
                newUser.student.class = 'empty';
                newUser.avt = 'avatar.jpg';
            }
                newUser.save(function (err) {
                    if (err) 
                        throw err;
                    return done(null, newUser)
                });
            })
        }
        }
    ));

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true 
    },
        function (req, username, password, done) {
            process.nextTick(function () {
                User.findOne({'highuser.username': username}, function (err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {
                        var newHighuser = new User();
                        newHighuser.highuser.name = 'admin';
                        newHighuser.role = 'admin';
                        newHighuser.highuser.username = username;
                        newHighuser.highuser.password = password;

                        newHighuser.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, newHighuser);
                        });
                    }
                });
            });
        }));

    passport.use('local-login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
        function (req, username, password, done) {
            User.findOne({'highuser.username': username}, function (err, user) {
                if (err)
                    return done(err);
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.'));
                if (user.highuser.password != password) {
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                }
                return done(null, user);
            });
        })
    );
}