const rateLimit = require('express-rate-limit');

const registrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 registrations per window
    message: { message: "Too many registrations from this IP, please try again after 15 minutes." }
});

module.exports = registrationLimiter;