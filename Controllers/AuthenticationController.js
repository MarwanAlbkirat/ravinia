const bcrypt = require("bcryptjs");
const joi = require("joi");
const jwt = require("jsonwebtoken");
const sendEmail = require("../Utils/SendMails");
const UserModel = require("../Models/UserModel");
const asyncHandler = require("express-async-handler");
const PasswordComplexity = require("joi-password-complexity");
/**
 * @DESC   Route For Register User
 * @ACCESS Public
 * @METHOD Post
 * @ROUTE  api/authentication/register
 */
const register = asyncHandler(
    async(req,res)=>{
        // validation
        const {error} = validationRegister(req.body);
        if(error)return res.status(400).json({message : error.details[0].message});

        // check if the email is already exsist in database
        const email = await UserModel.findOne({email:req.body.email});
        if(email)return res.status(400).json({message:"the user is already registered"});
        
        // Password encryption
        const salt = await bcrypt.genSalt(10);
        const password =  await bcrypt.hash(req.body.password,salt);

        // create user
        const user = new UserModel({
            username        : req.body.username,
            email           : req.body.email,
            password
        });

        // save user in database
        const result = await user.save();

        // send email to verify email by using json web token
        const token = user.generateJwt();
        const link = `http://localhost:3000/ActiveEmail/${token}`;
        const html= ` <div> 
        <h1>welcome to ravinia projec</h1>
        <h4>please click the button below to verfy your email addres</h4>
        <a href='${link}'>verfy your email</a> 
            </div> `;
        sendEmail(result.email,"Verfy Email" ,html);

        res.status(201).json({message:"The user has been registered successfully please verify your email and login"});
});

/**
 * @DESC   Route For Login User
 * @ACCESS Public
 * @METHOD Post
 * @ROUTE  api/login
 */
const login = asyncHandler(
    async(req,res)=>{
        // validation
        const {error} = validationLogin(req.body);
        if(error)return res.status(400).json({message : error.details[0].message});

        // check if the user email is already exsisting in our database
        const user = await UserModel.findOne({email:req.body.email});
        if(!user)return res.status(400).json({message:"The email or password is incorrect"});

        // check if the user password is match with the password in our database
        const decodedPassword = await bcrypt.compare(req.body.password , user.password);
        if(!decodedPassword)return res.status(400).json({message:"The email or password is incorrect"});

        // check if user email is verified
        // if not resend link
        if(!user.isAccountVerfied){
            const token = jwt.sign({email:user.email , id:user._id},process.env.JWT_SECRET_KEY,{ expiresIn:"10m" });
            const link = `http://localhost:3000/ActiveEmail/${token}`;
            const html= ` <div> 
                            <h1>welcome to ravinia project</h1>
                            <h4>please click the button below to verfy your email addres</h4>
                            <a href='${link}'>verfy your email</a> 
                        </div> `;
            sendEmail(user.email ,"verfi email" , html );
            return res.status(401).json({message:"Please activate the email"});
        }

        // generate token
        const token = user.generateJwt();

        // add token to user
        user._doc.token = token;

        // taking the attributes that's not important to client side
        const {password, __v,ownedCourse,followUpCourse,isAccountVerfied, ...other} = user._doc;
        res.status(200).send({...other});
});

/**
 * @DESC   Route For Verify Email The User
 * @ACCESS Public
 * @METHOD patch
 * @ROUTE  api/authentication/verifyEmail
 */
const verifyEmail = asyncHandler(
    async (req,res)=>{
        const user = await UserModel.findById(req.id);
        if(user.isAccountVerfied)return res.status(200).json("your account has already activated");
        user.isAccountVerfied = true;
        await user.save();
        res.status(200).json({message:"Your account has been activated"});
});

/**
 * @DESC   Route For Forgot Password The User
 * @ACCESS Public
 * @METHOD Post
 * @ROUTE  api/authentication/forgot-password
 */
const forgotPassword = asyncHandler(
    async(req,res)=>{
        // validation
        const {error} = forgotPasswordValidation(req.body);
        if(error)return res.status(400).json({message : error.details[0].message});
        // check email if exsist
        const user = await UserModel.findOne({email:req.body.email});
        if(!user)return res.status(404).json({message:"user not found"});
        // send email with link contain token
        const token = jwt.sign({id:user._id, email:user.email},process.env.JWT_SECRET_KEY,{expiresIn : "1h"});
        const link = `http://localhost:3000/reset-password/${token}`;
        const html= ` <div> 
        <h1>welcome to ravinia project</h1>
        <h4>please click the button below to reset your password</h4>
        <a href='${link}'>reset your password</a>
            </div> `;
        sendEmail(user.email,"reset password" ,  html);
        res.status(200).json({message:"please check your email"});
});

/**
 * @DESC   Route For reset Password The User
 * @ACCESS Public
 * @METHOD Patch
 * @ROUTE  api/authentication/reset-passwordd
 */
const resetPassword = asyncHandler(
    async(req,res)=>{
        // validation
        const {error} = resetPasswordValidation(req.body);
        if(error)return res.status(400).json({message : error.details[0].message});
        // hash password
        const salt = await bcrypt.genSalt(10);
        const password =  await bcrypt.hash(req.body.password,salt);
        // update password
        const user = await UserModel.findByIdAndUpdate(req.id,{
            $set:{
                password
            }
        });
        res.status(200).json({message:"Password has been modified successfully"});
});

// validations inputs
const validationRegister = (req)=>{
    const schema = joi.object({
        username        : joi.string().trim().required().min(3).max(60),
        email           : joi.string().trim().required().min(5).max(100).email(),
        password        : PasswordComplexity().required(),
        repeatPassword  : joi.any().valid(joi.ref('password')).required().options({ messages: { 'any.only': '{{#label}} does not match with password'} })
    });
    return schema.validate(req);
}
const validationLogin = (req)=>{
    const schema = joi.object({
        email           : joi.string().trim().required().min(5).max(100).email(),
        password        : joi.string().trim().required().min(8),
    });
    return schema.validate(req);
}
const forgotPasswordValidation = (req)=>{
    const schema = joi.object({
        email : joi.string().trim().required().min(5).max(100).email(),
    });
    return schema.validate(req);
}
const resetPasswordValidation = (req)=>{
    const schema = joi.object({
        password        : PasswordComplexity().required(),
        repeatPassword : joi.any().valid(joi.ref('password')).required().options({ messages: { 'any.only': '{{#label}} does not match with password'} })
    });
    return schema.validate(req);
}
module.exports = {register,login,verifyEmail,forgotPassword,resetPassword};