if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const engine = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo').default;
const passport = require('passport');
const methodOverride = require('method-override');
const LocalStrategy = require('passport-local');
const Admin = require('./models/Admin'); 
const deleteRoute = require("./routes/del");

// --- 1. Database Connection ---
// const dbURI = process.env.MONGODB_URI || process.env.ATLAS_URL || "mongodb://127.0.0.1:27017/GravIITy_N_and_D_Pvt_Ltd";
let dbURI = "mongodb+srv://dasnikhil200812_db_user:idiV7KeBEa7daqqo@cluster0.nwv4lge.mongodb.net/blossomWorld?appName=Cluster0";

mongoose.connect(dbURI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- 2. View Engine & Static Assets ---
app.engine('ejs', engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// --- 3. Body Parsers ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- 4. Mongo Session Store Setup ---
const store = new MongoStore({
    mongoUrl: dbURI,
    touchAfter: 24 * 3600,
    crypto: {
        secret: process.env.SESSION_SECRET || "TUISAdminSecretKey"
    }
});

store.on("error", function(e) {
    console.log("SESSION STORE ERROR", e);
});

const sessionOptions = {
    store: store, 
    name: 'session',
    secret: process.env.SESSION_SECRET || "TUISAdminSecretKey",
    resave: false,
    saveUninitialized: false, // Changed to false: Better for production/privacy
    proxy: true, 
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
        // Use a Date object for expires
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
};

app.use(session(sessionOptions));
app.use(flash());

// --- 5. Passport Config ---
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method')); 

passport.use(new LocalStrategy(Admin.authenticate()));
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

// --- 6. Global Variables Middleware ---
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user; 
    next();
});

// --- 7. Route Handling ---
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/", publicRoutes);
app.use("/admin", adminRoutes);
app.use("/d", deleteRoute);

// --- 8. Error Handling ---
app.use((req, res) => {
    res.status(404).render("404", { title: "Page Not Found" });
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something Went Wrong!";

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
        return res.status(statusCode).json({ message: err.message });
    }
    
    res.status(statusCode).render("404", { err }); 
});

// --- 9. Start Server ---
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});