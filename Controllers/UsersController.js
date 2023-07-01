const {cloudinaryUploadImage,cloudinaryRemoveImage} = require("../Utils/Cloudinary");
const UserModel = require("../Models/UserModel");
const CourseModel = require("../Models/CourseModel");
const sendEmail = require("../Utils/SendMails");
const jwt = require("jsonwebtoken");
const bcrypt =require("bcryptjs");
const path = require("path");
const fs = require("fs");
const joi = require("joi");
const asyncHandler = require("express-async-handler");
const PasswordComplexity = require("joi-password-complexity");
/**
 * @DESC   Route For Get All Users
 * @ACCESS Private (only admin)
 * @METHOD Get
 * @ROUTE  api/users/
 */
const getAllUsers = asyncHandler(
    async(req,res)=>{
        const users = await UserModel.find().select("-password -updatedAt -__v").populate("ownedCourse").populate("followUpCourse");
        res.status(200).json(users);
});

/**
 * @DESC   Route For Get All Users
 * @ACCESS Private (same user and admin)
 * @METHOD Get
 * @ROUTE  api/users/:id
 */
const getSpecificUser =  asyncHandler(
    async(req,res)=>{
        const user = await UserModel.findById(req.params.id).select("-password -__v").populate("ownedCourse","nameCourse creator CoursePhoto").populate("followUpCourse","nameCourse creator CoursePhoto");
        if(!user)return res.status(404).json({message:"user not found"});
        res.status(200).send(user);
});

/**
 * @DESC   Route For Update User
 * @ACCESS Private (same user)
 * @METHOD Put
 * @ROUTE  api/users/:id
 */
const updateUser =asyncHandler(
    async(req,res)=>{
    // validation
    const {error} = validationUpdate(req.body);
    if(error)return res.status(400).json({message : error.details[0].message});
    const user = await UserModel.findById(req.params.id);
    let html =null;
    // check if email is changed
    // if true then send mail to active new email
    if(req.body.email){
        if(user.email !== req.body.email){
            const token = user.generateJwt();
            const link = `http://localhost:3000/ActiveEmail/${token}`;
            html= ` <div> 
            <h1>welcome to ravinia projec</h1>
            <h4>please click the button below to verfy your email addres</h4>
            <a href='${link}'>verfy your email</a> 
                </div> `;
        }
    }
    // check if there password to hash it
    if(req.body.password){
        const salt = await bcrypt.genSalt(10);
        req.body.password =  await bcrypt.hash(req.body.password,salt);
    }
    if(html)sendEmail(req.body.email,"Verfy Email" ,html);
    // update
    await user.updateOne({
        $set :{
            username:req.body.username ? req.body.username : user.username,
            email:req.body.email ?req.body.email :user.email,
            password:req.body.password ? req.body.password : user.password ,
            isAccountVerfied: html ? false : true,
        }
    });
    res.status(200).json({message:"Your account has been modified successfully"});
});

/**
 * @DESC   Route For Delete User
 * @ACCESS Private (same user and admin)
 * @METHOD Delete
 * @ROUTE  api/users/:id
 */
const deleteUser = asyncHandler(
    async(req,res)=>{
        const user = await UserModel.findByIdAndDelete(req.params.id);
        if(!user)return res.status(404).json({message:"user not found"});
        // remove user from courses
        await CourseModel.updateMany({usersList:req.params.id},{
            $pull:{usersList:req.params.id}
        });
        res.status(200).json({message:"The user has been deleted"});
});

/**
 * @DESC   Route For Set Admin
 * @ACCESS Private (onlyadmin)
 * @METHOD Patch
 * @ROUTE  api/users/permission/:id
 */
const setAndRemovePermission = asyncHandler(
    async(req,res)=>{
        const user = await UserModel.findById(req.params.id);
        const state = user.isAdmin ? false : true;
        user.isAdmin = state;
        await user.save();
        if(state)return res.status(200).json({message:`${user.username} has successfully become an admin`});
        else return res.status(200).json({message:`Administrator permissions have been revoked ${user.username} successfully`});
});

/**
 * @DESC   Route For Upload Image User
 * @ACCESS Private (only user)
 * @METHOD Post
 * @ROUTE  api/users/profile-photo-upload/
 */
const profilePhoto = asyncHandler(
    async(req,res)=>{
        // validation
        if(!req.file)return res.status(400).json({message:"no file provided"});
        // get path image
        const pathImage = path.join(__dirname,`../Images/${req.file.filename}`);
        // upload to clodinary
        const result = await cloudinaryUploadImage(pathImage);
        // get the user from db
        const user  = await UserModel.findById(req.id);
        // delete the old profile image if exsist
        if(user.profilePhoto.publicId !== null){
            await cloudinaryRemoveImage(user.profilePhoto.publicId);
        }
        // change the profile photo field in db
        user.profilePhoto={
            url:result.secure_url,
            publicId:result.public_id   
        }
        await user.save();
        //  remove image from server
        fs.unlinkSync(pathImage);
        res.status(200).json({message:"Image uploaded successfully"});
});

// update validation
const validationUpdate = (req)=>{
    const schema = joi.object({
        username        : joi.string().trim().max(60).optional(),
        email           : joi.string().trim().max(100).email().optional(),
        password        : joi.string().trim().optional().allow('').min(8),
        repeatPassword  : joi.string().optional().allow('').valid(joi.ref("password"))
    });
    return schema.validate(req);
}
module.exports = {deleteUser,getSpecificUser,updateUser,getAllUsers,profilePhoto,setAndRemovePermission};