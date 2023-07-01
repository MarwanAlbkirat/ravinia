const mongoose = require("mongoose");
const AnswerSchema =new mongoose.Schema({
    answer:{
        type:String,
        trim:true,
        maxlength:300,
        required:true
    },
    mark:{
        type:Number,
        default:0,
    },
    question:{type:mongoose.Schema.Types.ObjectId,ref:"question",required:true},
    user:{type:mongoose.Schema.Types.ObjectId,ref:"user",required:true},
    exam:{type:mongoose.Schema.Types.ObjectId,ref:"exam",required:true},
    course:{type:mongoose.Schema.Types.ObjectId,ref:"Course",required:true}
},{timestamps:true});
const AnswerModel = mongoose.model("answer",AnswerSchema);
module.exports =  AnswerModel;