const mongoose = require("mongoose");
const ExamSchema =new mongoose.Schema({
    name:{
        type:String,
        trim:true,
        required:true,
        minlength:3,
        maxlength:100
    },
    startTime:{
        type:Date,
        required:true,
    },
    terminationTime:{
        type:Date,
        required:true,
    },
    active:{
        type:Boolean,
        default:false,
    },
    examPhoto :{
        type:Object,
        default:{
            url:"https://d20x1nptavktw0.cloudfront.net/wordpress_media/2022/07/blog-image-16.png",
            publicId:null,
        }
    },
    course:{type:mongoose.Schema.Types.ObjectId,ref:"Course"},
    questions:[{type:mongoose.Schema.Types.ObjectId,ref:"question"}],
    userList:
    [
        {
            id:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"user",
                required:true,
            },
            apply:{
                type:Boolean,
                default:true ,
            },
        },
        
    ],
},{timestamps:true});
const ExamModel = mongoose.model("exam",ExamSchema);
module.exports = ExamModel;