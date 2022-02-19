import passportLocal from "passport-local";
import bcrypt from "bcryptjs";
import User from "../models/Auth/User.js";
import AuthenticationError from "passport";

const LocalStrategy = passportLocal.Strategy;

export function passportFactory(passport, tokenService) {
    passport.use(new LocalStrategy({usernameField: "username"}, (username, password, done) => {
        User.findOne({username})
            .then((user) => {
                if (!user) {
                    return done(null, false, {
                        message: "That username is not registered"
                    });
                }
                // Match password
                bcrypt.compare(password, user.passwordHash, (err, isMatch) => {
                    if (err)
                        throw err;
                    if (isMatch) {
                        return done(null, user);
                    }
                    return done(null, false, {message: "Password incorrect"});
                });
            })
            .catch((err) => {
                throw new AuthenticationError(err);
            });
    }));
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });
};
