const CourseModel = require("../Models/CourseModel");
const UserModel =   require("../Models/UserModel");
const joi = require("joi");
const asyncHandler = require("express-async-handler");
const {cloudinaryUploadImage,cloudinaryRemoveImage} = require("../Utils/Cloudinary");
const path = require("path");
const fs = require("fs");
const mongoose = require('mongoose');
const ExamModel = require("../Models/ExamModel");
const QuestionModel = require("../Models/QuestionModel");
const AnswerModel = require("../Models/AnswerModel");
/**
 * @DESC   Route For Create Course
 * @ACCESS Private (Only Registerd User && logged in)
 * @METHOD Post
 * @ROUTE  api/course
 */
const createCourse = asyncHandler(
    async(req,res)=>{
        // validation
        const {error} = createCourseValidation(req.body);
        if(error)return res.status(400).json({message : error.details[0].message});
        // create new course
        const course = new CourseModel({
            nameCourse:req.body.nameCourse,
            creator:req.id,
            usersList:req.id
        });
        const result = await course.save();
        // set the course to user collection
        const user = await UserModel.findByIdAndUpdate(req.id,{
                $push: { ownedCourse:result._id, followUpCourse:result._id}
        });
        res.status(201).json({message:"course created"});
});

/**
 * @DESC   Route For Get All Courses
 * @ACCESS Private (Only Registerd User && logged in)
 * @METHOD Get
 * @ROUTE  api/course
 */
const getAllCourses = asyncHandler(
    async(req,res)=>{
        // get courses from database with registered users of the course
        const courses = await CourseModel.find().sort({createdAt:1}).select("-__v").populate('usersList',"username email profilePhoto");
        res.status(200).json(courses);
});

/**
 * @DESC   Route For Get Specific Courses
 * @ACCESS Private (Only Registerd User && logged in)
 * @METHOD Get
 * @ROUTE  api/course/:id
 */
const getSpecificCourse = asyncHandler(
    async(req,res)=>{
        const course = await CourseModel.findById(req.params.id).select("-__v").populate('usersList',"username email profilePhoto").populate("examList");
        res.status(200).send(course);
});

/**
 * @DESC   Route For update Courses
 * @ACCESS Private (Only own user )
 * @METHOD Put
 * @ROUTE  api/course/:id
 */
const updateCourse = asyncHandler(
    async(req,res)=>{
        // validation
        const {error} = updateCourseValidation(req.body);
        if(error)return res.status(400).json({message : error.details[0].message});
        // get course
        const course = await CourseModel.findById(req.params.id);
        if(!course)return res.status(404).json({message:"not found course"});
        // authorization
        if(course.creator.toString() !== req.id)return res.status(403).json({message:"you just can edit your own course"});
        // update course
        course.nameCourse = req.body.nameCourse;
        await course.save();
        res.status(200).json({message:"updated succssfuly"});
});

/**
 * @DESC   Route For Delete Courses
 * @ACCESS Private (Only own user )
 * @METHOD Delete
 * @ROUTE  api/course/:id
 */
const deleteCourse = asyncHandler(
    async(req,res)=>{
        // authorization
        const course = await CourseModel.findById(req.params.id);
        if(!course)return res.status(404).json({message:"not found course"});
        if(course.creator.toString() !== req.id)return res.status(403).json({message:"you just can delete your own course"});
        // delete all dependnce
        const users = await UserModel.updateMany({followUpCourse:req.params.id},{
                $pull:{followUpCourse :req.params.id,ownedCourse:req.params.id}
        });
        await course.deleteOne();
        await ExamModel.deleteOne({course:req.params.id});
        await QuestionModel.deleteMany({course:req.params.id});
        await AnswerModel.deleteMany({course:req.params.id});
        res.status(200).json({message:`deleted succssfuly ${course.nameCourse} course`});
});

/**
 * @DESC   Route For Add User To Course
 * @ACCESS Private (Only user )
 * @METHOD Patch
 * @ROUTE  api/course/add-user-course
 */
const addUserToCourse = asyncHandler(
    async(req,res)=>{
        // req id course
        const user = await UserModel.findById(req.id);
        const result = user.followUpCourse.includes(req.params.id);
        if(result)return res.status(400).json({message:"you are already joined to this course"});
        await user.updateOne({
            $push: { followUpCourse:req.params.id}
       });
       const course = await CourseModel.findByIdAndUpdate(req.params.id,{
        $push:{usersList:req.id}
       });
       res.status(201).json({message:`You have successfully joined to the ${course.nameCourse} course`})
});

/**
 * @DESC   Route For Remove User From Course
 * @ACCESS Private (Only user and own course)
 * @METHOD Patch
 * @ROUTE  api/course/remove-user-course
 */
const removeUserFromCourse = asyncHandler(
    async(req,res)=>{
        // i  need to allow admin to remove also
        const user = await UserModel.findById(req.id);
        const studentUser = user.followUpCourse.includes(req.params.id);
        if(!studentUser)return res.status(400).json({message:"You are not in this course"});
        await user.updateOne({
            $pull: { followUpCourse : req.params.id}
       });
       const course = await CourseModel.findByIdAndUpdate(req.params.id,{
        $pull:{usersList:req.id}
       });
       res.status(201).json({message:`The user ${user.username} has left ${course.nameCourse} course`})
});

/**
 * @DESC   Route For Upload Image Course
 * @ACCESS Private (only own course)
 * @METHOD Post
 * @ROUTE  api/course/profile-photo-upload/
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
        const course  = await CourseModel.findById(req.params.id);
        if(course.creator.toString() !== req.id)return res.status(403).json({message:"you just can delete your own course"});
        // delete the old profile image if exsist
        if(course.CoursePhoto.publicId !== null){
            await cloudinaryRemoveImage(course.CoursePhoto.publicId);
        }
        // change the profile photo field in db
        course.CoursePhoto={
            url:result.secure_url,
            publicId:result.public_id   
        }
        await course.save();
        //  remove image from server
        fs.unlinkSync(pathImage);
        res.status(200).json({message:"Image uploaded successfully"});
});

// validation
const createCourseValidation = (req)=>{
    const schema = joi.object({
        nameCourse:joi.string().trim().min(3).max(100).required(),
    });
    return schema.validate(req);
};
const updateCourseValidation = (req)=>{
    const schema = joi.object({
        nameCourse:joi.string().trim().min(3).max(100).optional(),
    });
    return schema.validate(req);
};
module.exports ={ getAllCourses,getSpecificCourse,updateCourse,deleteCourse,createCourse,addUserToCourse,removeUserFromCourse,profilePhoto};