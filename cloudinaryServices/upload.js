const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// 🔹 Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith("video/");
        const isPdf = file.mimetype === "application/pdf";

        const fileExt = file.originalname.split(".").pop(); // e.g., "pdf", "jpg"
        const baseName = file.originalname
            .replace(/\.[^/.]+$/, "") // remove extension
            .replace(/\s+/g, "_")     // replace spaces with underscores
            .replace(/\W+/g, "");     // remove non-alphanumeric

        const publicId = `${Date.now()}_${baseName}.${fileExt}`;

        const params = {
            folder: "uploads",
            public_id: publicId,
            resource_type: isPdf ? "raw" : (isVideo ? "video" : "image"),
        };

        // Set format only for non-PDF types
        if (!isPdf) {
            params.format = fileExt;
        }

        return params;
    },
});

// 🔹 Multer Middleware
const upload = multer({ storage });

module.exports = upload;