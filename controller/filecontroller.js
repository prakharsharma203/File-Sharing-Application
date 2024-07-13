const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const nodeMailer = require("nodemailer");
const FileModel = require("../model/filemodel");

dotenv.config();

const transporter = nodeMailer.createTransport({
  host: "127.0.0.1",
  port: "1025",
  secure: false,
});

const uploadFolderPath = "uploads";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolderPath),
  filename: (req, file, cb) => {
    const filename = uuidv4() + path.extname(file.originalname);
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5000000, // 5 MB
  },
}).single("attachment");

const uploadfile = (req, res) => {
  upload(req, res, async (error) => {
    if (error) {
      console.log(error);
      return res.status(400).json({
        success: false,
        message: "File size too large",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }
    console.log(req.file);
    const fileData = {
      originalName: req.file.originalname,
      newName: req.file.filename,
      size: req.file.size,
    };

    try {
      const newlyInsertedFile = await FileModel.create(fileData);
      console.log(newlyInsertedFile);
      res.json({
        success: true,
        message: "File uploaded successfully",
        fileId: newlyInsertedFile._id,
      });
    } catch (dbError) {
      console.log(dbError);
      res.status(500).json({
        success: false,
        message: "Database error",
      });
    }
  });
};

const generateSharableLink = async (req, res) => {
  try {
    const fileData = await FileModel.findById(req.params.fileId);
    if (!fileData) {
      // File is not available for this ID
      return res.status(400).json({
        success: false,
        message: "Invalid File ID",
      });
    }
    const sharableLink = `/file/downloads/${req.params.fileId}`;
    res.json({
      success: true,
      message: "File sharable link generated successfully",
      sharableLink: sharableLink,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
};

const downloadFile = async (req, res) => {
  const fileId = req.params.fileId;
  const fileData = await FileModel.findById(fileId);
  if (!fileData) {
    // File is not available for this ID
    return res.status(400).end("Invalid URL");
  }
  console.log(fileData);
  const path = `uploads/${fileData.newName}`;
  res.download(path, fileData.originalName);
};

const sendMail = async (req, res) => {
  const idName = req.body.fileId;
  const sharableLink = `${process.env.BASE_URL}/file/download/${idName}`;
  const emailData = {
    to: req.body.email,
    from: "do-not-reply@filesharing.com",
    subject: "File Sharing Link",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="text-align: center; color: #4CAF50;">You've Received a File!</h2>
      <p style="text-align: center;">
        Your friend has shared a file with you via the FileSharing App.
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <img src="https://media1.giphy.com/media/g88xUM1rTwjfLhoRYP/giphy.webp?cid=ecf05e47riqzc99aquvgz43pyt8bt9zvyd91uhg3tlbsk3wc&ep=v1_gifs_search&rid=giphy.webp&ct=g" alt="File Sharing" style="width: 200px; max-width: 500px; border-radius: 10px;">
      </div>
      <p style="text-align: center;">
        Click the button below to download your file:
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${sharableLink}" target="_blank" style="padding: 10px 20px; color: #fff; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">Download File</a>
      </div>
      <hr>
      <h3 style="color: #333;">File Details:</h3>
      <ul>
        <li><strong>File ID:</strong> ${idName}</li>
      </ul>
      <hr>
      <p>If you have any issues downloading the file, please contact our support team.</p>
      <p style="text-align: center; color: #777;">&copy; 2024 FileSharing App</p>
    </div>
    `,
  };
  transporter.sendMail(emailData, (error, info) => {
    if (error) {
      console.log(error);
      return res.json({
        success: false,
        message: "Unable to send email",
        error: error,
      });
    }
    console.log(info);
    res.json({
      success: true,
      message: "Mail sent successfully",
    });
  });
};

const fileController = {
  uploadfile,
  generateSharableLink,
  downloadFile,
  sendMail,
};

module.exports = fileController;
