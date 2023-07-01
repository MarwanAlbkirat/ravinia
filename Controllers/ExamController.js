const joi = require('joi').extend(require('@joi/date'));
const asyncHandler = require("express-async-handler");
const CourseModel = require("../Models/CourseModel");
const ExamModel = require("../Models/ExamModel");
const schedule = require('node-schedule');
const path = require("path");
const fs = require("fs");
const {cloudinaryUploadImage,cloudinaryRemoveImage} = require("../Utils/Cloudinary");
/**
 * @DESC   Route For Create Exam
 * @ACCESS Private (only owned course)
 * @METHOD Post
 * @ROUTE  api/exam/:id
 */
const createExam = asyncHandler(
    async(req,res)=>{
        req.body = JSON.parse(req.body.data);
        // validation
        const {error} = createExamvalidation(req.body);
        if(error)return res.status(400).json({message : error.details[0].message});
        let result = null;
        if(req.file){
            // get path image
            const pathImage = path.join(__dirname,`../Images/${req.file.filename}`);
            // upload to clodinary
            result = await cloudinaryUploadImage(pathImage);
            fs.unlinkSync(pathImage);
        }
        // check creator course
        const course = await CourseModel.findById(req.params.id);
        if(req.id != course.creator)return res.status(403).json({message:"You are not authorized to this action"});

        // save exam in datebase
        const exam = new ExamModel({
            name            : req.body.name,
            startTime       : new Date(req.body.startTime),
            terminationTime : new Date(req.body.terminationTime),
            course          : req.params.id,
            examPhoto:{
                url: result ?  result.secure_url : "https://d20x1nptavktw0.cloudfront.net/wordpress_media/2022/07/blog-image-16.png",
                publicId: result ? result.public_id  :null
            }
        });
        await exam.save();
        const date = new Date(exam.startTime);
        const job = schedule.scheduleJob(date,async function(){
            await exam.updateOne({
                $set:{
                    active:true
                }
            });
          });
          const date2 = new Date(exam.terminationTime);
        const job2 = schedule.scheduleJob(date2,async function(){
            await exam.updateOne({
                $set:{
                    active:false
                }
            });
          });
        // adding exam to course collection
        await course.updateOne({
            $push:{examList:exam._id}
        });
        res.status(201).json({message:"An exam has been created successfully. Please fill in the questions"});
});

/**
 * @DESC   Route For Update Exam
 * @ACCESS Private (only owned course)
 * @METHOD Put
 * @ROUTE  api/exam/:id -->id for exam
 */
const updateExam = asyncHandler(
    async(req,res)=>{
        req.body = JSON.parse(req.body.data);
        let result = null;
        if(req.file){
            const pathImage = path.join(__dirname,`../Images/${req.file.filename}`);
            result = await cloudinaryUploadImage(pathImage);
            fs.unlinkSync(pathImage);
        }
        // check authorixation
        const course = await CourseModel.findOne({creator:req.id},{examList:req.params.id});
        if(!course)return res.status(403).json({message:"You are not authorized to do this action"});
        // validation
        const {error} = UpdateExamvalidation(req.body);
        if(error)return res.status(400).json({message : error.details[0].message});
        // check if exam active online or not
        const exam = await ExamModel.findById(req.params.id);
        if(exam.active)return res.status(400).json({message:"The exam has begun"});
        // update exam information
        await exam.updateOne({
            $set:{
                name            : req.body.name ? req.body.name : exam.name,
                startTime       : req.body.startTime ? new Date(req.body.startTime) : exam.startTime,
                terminationTime : req.body.terminationTime ? new Date(req.body.terminationTime) : exam.terminationTime,
                examPhoto:{
                    url: result ? result.secure_url : exam.examPhoto.url, 
                    publicId:result ? result.public_id   : exam.examPhoto.url  
                }
            }
        });
        res.status(200).json({message:"Exam information has been modified succssfuly"});
});
const activeExam = asyncHandler(
    async(req,res)=>{
        // check authorixation
        const course = await CourseModel.findOne({creator:req.id},{examList:req.params.id});
        if(!course)return res.status(403).json({message:"You are not authorized to do this action"});
        // check if exam active online or not

        const exam = await ExamModel.findById(req.params.id);
        // update exam information
        await exam.updateOne({
            $set:{
                active : !exam.active
            }
        });
        res.status(200).json({message:exam.active ? "Exam has been disabled": "The exam has been activated"});
});


/**
 * @DESC   Route For Delete Exam
 * @ACCESS Private (only owned course)
 * @METHOD Delete
 * @ROUTE  api/exam/:id
 */
const deleteExam = asyncHandler(
    async(req,res)=>{
        // check authorixation
        const course = await CourseModel.findOne({creator:req.id},{examList:req.params.id});

        if(!course)return res.status(403).json({message:"You are not authorized to do this action"});
        // check if exam active online or not
        const exam = await ExamModel.findById(req.params.id);
        if(exam.active)return res.status(400).json({message:"The exam has begun"});
        // delete exam from course
        await course.updateOne({
            $pull:{examList:exam._id}
        });
        // delete exam
        await exam.deleteOne();
        res.status(200).json({message:"Exam has been deleted succssfuly"});
});


/**
 * @DESC   Route For Get Specific Exam
 * @ACCESS Private (only owned course and users registerd in same course)
 * @METHOD Get
 * @ROUTE  api/exam/:id
 */
const getExam = asyncHandler(
    async(req,res)=>{
        const exam = await ExamModel.findById(req.params.id).select("-__v").populate("questions");
        res.status(200).json(exam);
});


/**
 * @DESC   Route For Get All Exams
 * @ACCESS Private (only owned course and users registerd in same course)
 * @METHOD Get
 * @ROUTE  api/exam/:id -->course id
 */
const getAllExam = asyncHandler(
    async(req,res)=>{
        // check authorixation
        const course = await CourseModel.findOne({creator:req.id},{examList:req.params.id},{userList:req.id});
        if(!course)return res.status(403).json({message:"You are not authorized to do this action"});
        // send exam
        const exam = await ExamModel.find({course: req.params.id});
        res.status(200).send(exam);
});

/**
 * @DESC   Route For Get All Exams
 * @ACCESS Private (only owned course and users registerd in same course)
 * @METHOD Get
 * @ROUTE  api/exam/:id -->course id
 */
const startExamUser = asyncHandler(
    async(req,res)=>{
        // check authorization
        const course = await CourseModel.findOne({usersList:req.id},{examList:req.params.id});
        if(!course)return res.status(403).json({message:"You are not authorized to do this action"});
        // update exam
        await ExamModel.findByIdAndUpdate(req.params.id,{
            $push:{
                userList:{
                    id:req.id,
                },
            }
        });
        res.status(200).json({message:"Exam start"});
});
/**
 * @DESC   Route For Get All Exams
 * @ACCESS Private (only owned course and users registerd in same course)
 * @METHOD Get
 * @ROUTE  api/exam/:id -->course id
 */
const endExamUser = asyncHandler(
    async(req,res)=>{
        // check authorization
        const course = await CourseModel.findOne({usersList:req.id},{examList:req.params.id});
        if(!course)return res.status(403).json({message:"You are not authorized to do this action"});
        // update exam
        await ExamModel.findByIdAndUpdate(req.params.id,{
            id: req.id,
            $set: {userList:{id:req.id,apply:false}} 
        });
        res.status(200).json({message:"Exam end"});
});

// validation
const createExamvalidation = (req)=>{
    const schema = joi.object({
        name            : joi.string().trim().required().min(3).max(100),
        startTime  :        joi.date().min(Date.now() + 1 * 2000 ).max(Date.now() + 72 * 60 * 60 * 1000).required(),
        terminationTime  :joi.date().min(Date.now() + 5 * 2000 ).max(Date.now() + 72 * 60 * 60 * 1000).required(),
    });
    return schema.validate(req);
}
const UpdateExamvalidation = (req)=>{
    const schema = joi.object({
        name            : joi.string().trim().min(3).max(100),
        startTime  :        joi.date().min(Date.now() + 1 * 2000 ).max(Date.now() + 72 * 60 * 60 * 1000),
        terminationTime  :joi.date().min(Date.now() + 5 * 2000 ).max(Date.now() + 72 * 60 * 60 * 1000),
    });
    return schema.validate(req);
}
module.exports ={createExam,getAllExam,getExam,deleteExam,updateExam,activeExam,startExamUser,endExamUser};