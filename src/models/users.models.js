import dotenv from "dotenv"
dotenv.config()

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const fileSchema = mongoose.Schema({
    url: String,
    public_id: String
},
{ _id: false })

const userSchema = mongoose.Schema({
    userName : {
        type : String,
        required : true,
        lowercase : true,
        unique : true,
        trim: true,
        index: true,
    },
    email : {
        type : String,
        required : true,
        lowercase : true,
        unique : true,
        trim: true,
        index: true,
    },
    fullName : {
        type : String,
        required : true,
        lowercase : true,
        trim: true,
    },
    password : {
        type : String,
        required : true,
    },
    avatar: {
        type: fileSchema,
        required: true
    },
    refreshToken: String
}, {timestamps: true,})

userSchema.methods.isPasswordCorrect = async function (password){
    if(!password) return false;
    
    return await bcrypt.compare(password, this.password);
}


userSchema.pre('save', async function(next){
    if(!this.isModified('password'))
        return next()
    
    this.password = await bcrypt.hash(this.password, 10)
    next()
});

userSchema.methods.generateRefreshToken = async function(){
    const payload = {
        _id: this._id,
        email: this.email,
        userName: this.userName
    };

    const options = {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // Token will expire in 1 hour
        algorithm: 'HS256' // HMAC SHA256 algorithm
    };

    const refreshToken = await jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, options);
    // console.log('Generated JWT:', refreshToken);

    return refreshToken
};

userSchema.methods.generateAccessToken = async function(){
    const payload = {
        _id: this._id,
        email: this.email,
        userName: this.userName
    };

    const options = {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // Token will expire in 1 hour
        algorithm: 'HS256' // HMAC SHA256 algorithm
    };

    const accessToken = await jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, options);
    // console.log('Generated JWT:', accessToken);

    return accessToken
};

export const User = new mongoose.model('User', userSchema);