const mongoose = require('mongoose');
// Alternative if the above still fails
const passportLocalMongoose = require('passport-local-mongoose').default || require('passport-local-mongoose');

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        default: 'admin'
    }
});

// This adds a username, hash, and salt field to store passwords securely
adminSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Admin', adminSchema);