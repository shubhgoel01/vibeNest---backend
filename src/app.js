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
import tempRouter from '../checkDatabseConnectivity/route.CDC.js';
import { commentRouter } from './routes/comments.routes.js';
import { likesRouter } from '../src/routes/likes.routes.js'
import { userRouter } from './routes/user.routes.js';
import followRouter from './routes/follow.routes.js';
import { authRouter } from './routes/user.routes.js';

app.use(errorRouter)
app.use(tempRouter)

app.use("/v1" ,commentRouter)
app.use("/v1" ,likesRouter)
app.use("v1/posts", postRouter)
app.use("/user/v1", userRouter)
app.use("/v1/user/:userID", followRouter)
app.use("/v1/auth", authRouter)


//Import Custom Middlewares
import { globalErrorHandler } from './middlewares/error.middlewares.js';

app.use(globalErrorHandler);

export default app
