const mongoose = require("mongoose");
const CourseSchema = new mongoose.Schema({
    nameCourse:{
        type:String,
        minlength:3,
        maxlength:100,
        required:true,
        trim:true,
    },
    creator:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,
    },
    CoursePhoto :{
        type:Object,
        default:{
            url:"https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/cb/3c4030d65011e682d8b14e2f0915fa/shutterstock_226881610.jpg?auto=format%2Ccompress&dpr=1",
            publicId:null,
        }
    },
    usersList:[{type:mongoose.Schema.Types.ObjectId,ref:"user"}],
    questionList:[{type:mongoose.Schema.Types.ObjectId,ref:"question"}],
    examList :[{type:mongoose.Schema.Types.ObjectId,ref:"exam"}],
},{
    timestamps:true,
});
const CourseModel = mongoose.model("Course",CourseSchema);
module.exports = CourseModel;