const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/Auth/User.js");
const AuthenticationError = require("passport");

module.exports = function (passport) {
    passport.use(
        new LocalStrategy({usernameField: "username"}, (username, password, done) => {
            User.findOne({username})
                .then((user) => {
                    if (!user) {
                        return done(null, false, {
                            message: "That username is not registered"
                        });
                    }

                    // Match password
                    bcrypt.compare(password, user.passwordHash, (err, isMatch) => {
                        if (err) throw err;

                        if (isMatch) {
                            return done(null, user);
                        }
                        return done(null, false, {message: "Password incorrect"});
                    });
                })
                .catch((err) => {
                    throw new AuthenticationError(err);
                });
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });
};
