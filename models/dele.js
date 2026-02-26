const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const delSchema = new Schema({
    username: String,
    image:{
        url: String,
        filename: String
    }
});

const Del = mongoose.model("Del", delSchema);

module.exports = Del;