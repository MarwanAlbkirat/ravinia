const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const UserSchema = new mongoose.Schema({
    username :{
        type:String,
        minlength :3,
        maxlength:60,
        required:true,
        trim:true,
    },
    email :{
        type:String,
        minlength :5,
        maxlength:100,
        required:true,
        trim:true,
        unique:true
    },
    password :{
        type:String,
        minlength :5,
        required:true,
        trim:true,
    },
    profilePhoto :{
        type:Object,
        default:{
            url:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
            publicId:null,
        }
    },
    isAccountVerfied :{
        type:Boolean,
        default:false
    },
    isAdmin :{
        type:Boolean,
        default:false
    },
    ownedCourse:[{type:mongoose.Schema.Types.ObjectId,ref:"Course"}],
    followUpCourse:[{type:mongoose.Schema.Types.ObjectId,ref:"Course"}],
},{
    timestamps:true,
});
UserSchema.methods.generateJwt = function(){
  return  jwt.sign({id:this._id,isAdmin:this.isAdmin},process.env.JWT_SECRET_KEY);
}
const UserModel = mongoose.model("user",UserSchema);
module.exports = UserModel;