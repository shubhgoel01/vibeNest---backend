import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(process.cwd(), "public", "temp");
    console.log("multer: destination resolved ->", dest, "for file", file.originalname);
    cb(null, dest);
    // ✅ Always resolves to absolute path
  },
  filename: function (req, file, cb) {
    console.log("multer: saving filename ->", file.originalname);
    cb(null, file.originalname);
  }
});

export const upload = multer({ storage });
