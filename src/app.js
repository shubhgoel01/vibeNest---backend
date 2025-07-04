import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

//Inbuilt Middleware
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))
app.use(cookieParser())

//Import routes
import errorRouter from './routes/error.routes.js';
app.use(errorRouter)

import tempRouter from '../checkDatabseConnectivity/route.CDC.js';
app.use(tempRouter)

//Import Custom Middlewares
import { globalErrorHandler } from './middlewares/error.middlewares.js';

app.use(globalErrorHandler);

export default app
