const {Schema, model} = require("mongoose");

let dataSchema = new Schema({
    name: String,
    userID: String,
    tuna: Number,
    daily: Number,
})

module.exports = model("KohiData", dataSchema);