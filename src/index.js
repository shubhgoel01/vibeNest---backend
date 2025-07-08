import dotenv from "dotenv"
dotenv.config()

import connectDB from "./db/index.db.js";
import app from "./app.js";
import asyncHandler from "./utils/asyncHandler.utils.js";
connectDB()
    .then( ()=>{
        const port = process.env.PORT || 4000
        const server = app.listen(port, () => {
            console.log(`Server started Successfuly Running on http://localhost:${port}`)
        })

        // console.log(server)

        server.on("error", (error) => {
            console.log(`Server Failed to start: `, error)
            process.exit(1)
        })
    } )
    .catch((error) => {
        console.log(`Failed to connect to database: `, error)
    })