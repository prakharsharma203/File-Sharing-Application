const express = require("express");

const router = express.Router();

const fileController = require("../controller/filecontroller")

router.post("/api/file",fileController.uploadfile) //Upload a file

router.get("/file/:fileId",fileController.generateSharableLink); //Generate Sharable Link

router.get("/file/download/:fileId",fileController.downloadFile); //Download File

router.post("/api/file/send",fileController.sendMail) // For sending Mail

module.exports = router;