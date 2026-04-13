const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const ensureDir = (relativePath) => {
  const absolutePath = path.join(__dirname, relativePath);
  fs.mkdirSync(absolutePath, { recursive: true });
  return absolutePath;
};

const createDiskStorage = (relativeDir) => {
  const uploadDir = ensureDir(relativeDir);
  return multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const safeBase = path
        .basename(file.originalname || "upload", ext)
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "upload";
      cb(null, `${Date.now()}-${safeBase}${ext.toLowerCase()}`);
    }
  });
};

let storage;
let storagePdf;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "school/admission",
      resource_type: "image"
    }
  });

  storagePdf = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "school/notice",
      resource_type: "raw",
      allowed_formats: ["pdf"],
      contentType: "application/pdf",
      public_id: () => Date.now().toString()
    }
  });
} else {
  storage = createDiskStorage(path.join("public", "uploads", "admission"));
  storagePdf = createDiskStorage(path.join("public", "uploads", "notice"));
}

module.exports = { cloudinary, storage, storagePdf, hasCloudinaryConfig };
