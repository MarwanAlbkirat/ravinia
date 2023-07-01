const mongoose = require("mongoose");
const possibilitiesSchema = mongoose.Schema({
    possibility:{
        type:String,
        required:true,
    },
});
const MultipleChoiceSchema = mongoose.Schema({
    rightSolution:{
        type:String,
        required:true
    },
    possibilities:
    [
        {type:possibilitiesSchema}
    ],
});
const fillGapsSchema = mongoose.Schema({
    gab:{
        type:String,
        required:true,
    }
});
const QuestionSchema = new mongoose.Schema({
    question:{
        type:String,
        minlength:5,
        maxlength:300,
        required:true,
        trim:true,
    },
    mark:{
        type:Number,
        required:true,
    },
    questionType:{
        type:Object,
        typeQuestion:{
            "True False":Boolean,
            "Multiple Choice":MultipleChoiceSchema,
            "Fill Gaps"      :fillGapsSchema,
            "Thematic":"",
        },
        required:true,
    },
    exam:{type:mongoose.Schema.Types.ObjectId,ref:"exam"},
    course:{type:mongoose.Schema.Types.ObjectId,ref:"Course"},
    answer:{type:mongoose.Schema.Types.ObjectId,ref:"answer",},
},{timestamps:true});
const QuestionModel = mongoose.model("question",QuestionSchema);
module.exports = QuestionModel;