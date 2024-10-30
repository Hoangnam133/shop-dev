const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require('./models/userModel'); // Điều chỉnh đường dẫn nếu cần

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    // Không sử dụng clientSecret cho ứng dụng di động
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Tìm người dùng trong cơ sở dữ liệu
        let existingUser = await userModel.findOne({ googleId: profile.id });
        
        if (existingUser) {
            // Nếu người dùng đã tồn tại
            return done(null, existingUser);
        }
        const newUser = await userModel.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            roles: 'USER'
        });

        done(null, newUser);
    } catch (error) {
        done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    userModel.findById(id)
        .then((user) => {
            done(null, user);
        })
        .catch((error) => {
            done(error, null);
        });
});
