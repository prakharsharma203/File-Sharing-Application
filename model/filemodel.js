const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    originalName:{
        type: String,
        required: true,
    },
    newName:{
        type: String,
        required: true,
    },
    size:{
        type: Number,
        required: true,
    }
})

const FileModel = mongoose.model("File", fileSchema);

module.exports = FileModel;