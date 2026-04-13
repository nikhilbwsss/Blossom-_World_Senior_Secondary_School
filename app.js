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
const multer = require("multer");

const Admin = require("./models/Admin");
const deleteRoute = require("./routes/del");

const getRequiredEnv = (keys) => {
    for (const key of keys) {
        if (process.env[key]) return process.env[key];
    }
    throw new Error(`Missing required environment variable. Expected one of: ${keys.join(", ")}`);
};

// ENV
const dbURI = getRequiredEnv(["MONGODB_URI", "ATLAS_URL"]);
const sessionSecret = getRequiredEnv(["SESSION_SECRET", "SECRET"]);

// View Engine
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Security headers
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

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Passport init (without session yet)
app.use(passport.initialize());
app.use(methodOverride("_method"));

passport.use(new LocalStrategy(Admin.authenticate()));
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

// Routes
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Port
const port = process.env.PORT || 3000;

async function startServer() {
    try {
        // 1. Connect MongoDB
        await mongoose.connect(dbURI);
        console.log("MongoDB Connected Successfully");

        // 2. Trust proxy (Render)
        app.set("trust proxy", 1);

        // 3. Create Mongo session store
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

        // 4. Session middleware (IMPORTANT)
        app.use(session({
            name: "session",
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
            store: store,
            proxy: true,
            cookie: {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000
            }
        }));

        // 5. Flash
        app.use(flash());

        // 6. Passport session (AFTER session)
        app.use(passport.session());

        // 7. CSRF (basic)
        app.use((req, res, next) => {
            if (!req.session.csrfToken) {
                req.session.csrfToken = crypto.randomBytes(32).toString("hex");
            }
            res.locals.csrfToken = req.session.csrfToken;
            next();
        });

        // 8. Global variables
        app.use((req, res, next) => {
            res.locals.success = req.flash("success");
            res.locals.error = req.flash("error");
            res.locals.currUser = req.user;
            next();
        });

        // 9. Routes
        app.use("/", publicRoutes);
        app.use("/admin", adminRoutes);
        app.use("/d", deleteRoute);

        // 10. 404
        app.use((req, res) => {
            res.status(404).render("404", { title: "Page Not Found" });
        });

        // 11. Error handler
        app.use((err, req, res, next) => {
            let statusCode = err.statusCode || err.status || 500;

            if (err instanceof multer.MulterError) {
                statusCode = err.code === "LIMIT_FILE_SIZE" ? 400 : 400;
                err.message = err.code === "LIMIT_FILE_SIZE"
                    ? "Student photo must be 1MB or smaller."
                    : err.message;
            }

            if (/Only JPG, PNG, or WEBP images are allowed|Only PDF files are allowed/i.test(err.message || "")) {
                statusCode = 400;
            }

            if (!err.message) err.message = "Something Went Wrong!";

            console.error(err);

            if (req.xhr || (req.headers.accept && req.headers.accept.includes("json"))) {
                return res.status(statusCode).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(statusCode).render("404", { err });
        });

        // 12. Start server
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

    } catch (err) {
        console.error("MongoDB startup connection failed:", err.message);
        process.exit(1);
    }
}

startServer();
