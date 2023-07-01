const joi = require('joi').extend(require('@joi/date'));
const asyncHandler = require("express-async-handler");
const CourseModel = require("../Models/CourseModel");
const ExamModel = require("../Models/ExamModel");
const AnswerModel = require("../Models/AnswerModel");
const solveAnswer =asyncHandler(
    async(req,res)=>{
        const arr = Object.values(req.body);
        const answer =await AnswerModel.insertMany(arr);
        res.status(201).json({message:'Exam answers have been submitted'});
});
const getSolve =asyncHandler(
    async(req,res)=>{
        const solve = await AnswerModel.find({user:req.id},{exam:req.params.id});
        res.status(200).send(solve);
});
module.exports ={solveAnswer,getSolve}