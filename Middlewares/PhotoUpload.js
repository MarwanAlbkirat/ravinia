const path = require("path");
const multer = require("multer");
// photo storage
const photoStorage =multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,"../Images"));
    },
    filename:function (req,file,cb){
        if(file){
            cb(null,new Date().toISOString().replace(/:/g,"-")+file.originalname);
        }else{
            cb(null,false);
        }
    }
});
// photo upload middleware 
const photoUpload = multer({
    storage:photoStorage,
    fileFilter:function(req,file,cb){
        if(file.mimetype.startsWith("image")){
            cb(null,true);
        }else{
            cb({message:"Unsupported file format"},false);
        }
    },
    limits:{fileSize :1024 * 1024},
});
module.exports = photoUpload;