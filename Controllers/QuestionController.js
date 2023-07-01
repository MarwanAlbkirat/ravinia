const QuestionModel = require("../Models/QuestionModel");
const asyncHandler = require("express-async-handler");
const joi = require("joi");
const ExamModel = require("../Models/ExamModel");
const CourseModel = require("../Models/CourseModel");
const mongoose = require("mongoose");
/**
 * @DESC   Route For Create Qestion
 * @ACCESS Private (only owned course)
 * @METHOD Post
 * @ROUTE  api/question/
 */
const createQuestion = asyncHandler(
    async(req,res)=>{
        // check authorization
        const course = await CourseModel.findOne({creator:req.id},{examList:req.params.id});
        if(!course)return res.status(403).json({message:"you are not authorized to do this action"});
        // validation
        const {error} = createExamvalidation(req.body);
        if(error)return res.status(400).json({message : error.details[0].message});
        const question = new QuestionModel({
            question:req.body.question,
            mark: +req.body.mark,
            questionType:req.body.questionType,
            exam:req.params.id,
            course:course._id
        });
        await question.save();
        // add question to course and exam
        const exam = ExamModel.findById(req.params.id);
        await exam.updateOne({
            $push:{questions:question._id}
        });
        await course.updateOne({
            $push:{questionList:question._id}
        });
        res.status(201).send(question);
});

/**
 * @DESC   Route For Update Qestion
 * @ACCESS Private (only owned course)
 * @METHOD Put
 * @ROUTE  api/question/:id
 */
const updateQuestion = asyncHandler(
    async(req,res)=>{
        // check authorization
        const course = await CourseModel.findOne({creator:req.id},{examList:req.headers.exam},{questionList:req.params.id});
        if(!course)return res.status(403).json({message:"you are not authorized to do this action"});
        // validation
        const {error} = updateExamvalidation(req.body);
        if(error)return res.status(400).json({message : error.details[0].message});
        // update question
        const question = await QuestionModel.findOneAndUpdate(req.params.id,{
            $set:{
                question:req.body.question,
                mark: +req.body.mark,
                questionType:req.body.questionType,
            }
        });
        res.status(200).json("succssfuly updated");
});

/**
 * @DESC   Route For Delete Qestion
 * @ACCESS Private (only owned course)
 * @METHOD Delete
 * @ROUTE  api/question/:id
 */
const deleteQuestion = asyncHandler(
    async(req,res)=>{
        // check authorization
        const question = await QuestionModel.findById(req.params.id);
        const course = await CourseModel.findOne({creator:req.id});
        if(question.course.toString() !== course._id.toString())return res.status(403).json({message:"you are not authorized to do this action"});
        // ceck if exam active
        const exam = await ExamModel.findOne({questions:req.params.id});
        if(exam.length > 0 )return res.status(400).json({message:"there are exam is active wait to finish"});
        // delete qestion
        await QuestionModel.findOneAndDelete(req.params.id);
        // delete from course and exam
        await course.updateOne({
            $pull:{questionList:req.params.id}
        });
        // back to it
        await exam.updateOne({
            $pull:{questions:req.params.id}
        });

        res.status(200).json({message:"succssfuly deleted"});
});

/**
 * @DESC   Route For Get All Qestion (two behaviors ,first get all question at the level of the course , secound get all question at the level of the exam)
 * @ACCESS Private (only owned course)
 * @METHOD Get
 * @ROUTE  api/question/
 */
const getAllQuestion = asyncHandler(
    async(req,res)=>{
        // check authorization
        // i need id creator && id course and level
        // Get the required course
        const course = await CourseModel.findOne({$and :[ {creator:{$eq:req.id}} , {_id:{$eq:req.headers.courseId}} ]});
        if(course)return res.status(403).json({message:"you are not authorized"});
        // check level
        if(req.headers.level === "course"){
            const question = await QuestionModel.find({course:req.headers.courseId});
            return res.status(200).send(question);
        }
        else{
            const question = await QuestionModel.find({exam:req.headers.examId});
            return res.status(200).send(question);
        }
});

/**
 * @DESC   Route For Get All Qestion (two behaviors ,first get all question at the level of the course , secound get all question at the level of the exam)
 * @ACCESS Private (only owned course)
 * @METHOD Get
 * @ROUTE  api/question/
 */
const getExamQuestion = asyncHandler(
    async(req,res)=>{
        // check authorization
        const question = await QuestionModel.find({exam:req.params.id}).sort({createdAt:-1});
        res.status(200).send(question);
});
// validation
const createExamvalidation = (req)=>{
    const schema = joi.object({
        question        : joi.string().trim().required().min(5).max(300),
        mark            : joi.number().min(1).required().max(1000),
        questionType    : joi.object(),
        questionType:{
            typeQuestion:{
                "Multiple Choice":{
                    rightSolution:joi.string().required(),
                    possibilities:joi.array().items(joi.object({
                        possibility:joi.string().required(),
                    })),
                },
                "Fill Gaps":{
                    gab:joi.string().trim().required()
                },
                "Thematic":"",
                "True False":joi.boolean(),
            }
        } 
    });
    return schema.validate(req);
}
const updateExamvalidation = (req)=>{
    const schema = joi.object({
        question        : joi.string().trim().min(5).max(300),
        mark            : joi.number().min(1).max(1000),
        questionType    : joi.object(),
        // questionType:{
            typeQuestion:{
                "Multiple Choice":{
                    counrOfpossibilities:joi.number(),
                    possibilities:joi.array().items(joi.object({
                        possibility:joi.string(),
                        rightSolution:joi.boolean(),
                    })),
                },
                "Fill Gaps":{
                    gab:joi.string().trim()
                },
                "Thematic":"",
            }
        // } 
    });
    return schema.validate(req);
}
module.exports ={createQuestion,updateQuestion,deleteQuestion,getExamQuestion};