import express from 'express';
import { asyncErrorContorller } from '../controllers/error.controller.js';
import { syncErrorController } from '../controllers/error.controller.js';

const errorRouter = express.Router();

errorRouter.route("/asyncError").get(asyncErrorContorller)
errorRouter.route("/syncError").get(syncErrorController)

export default errorRouter