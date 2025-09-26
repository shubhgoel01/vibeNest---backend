import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(process.cwd(), "public", "temp");

    // 🔑 Ensure the folder exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    console.log("multer: destination resolved ->", dest, "for file", file.originalname);
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    console.log("multer: saving filename ->", file.originalname);
    cb(null, file.originalname);
  }
});

export const upload = multer({ storage });
