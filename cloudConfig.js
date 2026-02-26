const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "school/admission",
    resource_type: "image"
  }
});

// Resume storage
const storagePdf = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "school/notice",
    resource_type: "raw",
    allowed_formats: ["pdf"],
    contentType: "application/pdf",   // <-- IMPORTANT!
    public_id: (req, file) => Date.now().toString()
  }
});

module.exports = { cloudinary, storage, storagePdf };
