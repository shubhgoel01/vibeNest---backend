import express from "express"
import uploadData from "./uploadDataController.CDC.js";

const tempRouter = express.Router();

tempRouter.route("/UploadData").post(uploadData)

export default tempRouter