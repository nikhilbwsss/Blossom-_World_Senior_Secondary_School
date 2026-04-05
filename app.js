if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const crypto = require("crypto");
const engine = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const methodOverride = require("method-override");
const LocalStrategy = require("passport-local");
const Admin = require("./models/Admin");
const deleteRoute = require("./routes/del");

const getRequiredEnv = (keys) => {
    for (const key of keys) {
        if (process.env[key]) return process.env[key];
    }
    throw new Error(`Missing required environment variable. Expected one of: ${keys.join(", ")}`);
};

// --- 1. Database Connection ---
const dbURI = getRequiredEnv(["MONGODB_URI", "ATLAS_URL"]);
const sessionSecret = getRequiredEnv(["SESSION_SECRET", "SECRET"]);

// --- 2. View Engine & Static Assets ---
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.disable("x-powered-by");
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
});

// --- 3. Body Parsers ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- 4. Mongo Session Store Setup ---
const sessionOptions = {
    name: "session",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax"
    }
};

app.use(session(sessionOptions));
app.use(flash());
app.use((req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
});

// --- 5. Passport Config ---
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

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

    console.error("\nERROR HANDLER CAUGHT:");
    console.error("Status:", statusCode);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    console.error("URL:", req.originalUrl);
    console.error("Method:", req.method);
    console.error("");

    if (req.xhr || (req.headers.accept && req.headers.accept.includes("json"))) {
        return res.status(statusCode).json({
            success: false,
            message: err.message,
            error: process.env.NODE_ENV === "development" ? err.toString() : undefined
        });
    }

    res.status(statusCode).render("404", { err });
});

// --- 9. Start Server ---
const port = process.env.PORT || 3000;

async function startServer() {
    try {
        await mongoose.connect(dbURI);
        console.log("MongoDB Connected Successfully");

        const store = MongoStore.create({
            mongoUrl: dbURI,
            touchAfter: 24 * 3600,
            crypto: {
                secret: sessionSecret
            }
        });

        store.on("error", (e) => {
            console.log("SESSION STORE ERROR", e);
        });

        sessionOptions.store = store;

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (err) {
        console.error("MongoDB startup connection failed:", err.message);
        process.exit(1);
    }
}

startServer();
