const Router = require("express").Router();
const checkId = require("../Middlewares/CheckId");
const verfyToken = require("../Middlewares/verfyToken");
const examController = require("../Controllers/ExamController");
const photoUpload = require("../Middlewares/PhotoUpload");

Router.post   ("/:id"                , checkId , verfyToken ,photoUpload.single("image"), examController.createExam       );
Router.get    ("/:id"                , checkId , verfyToken , examController.getExam          );
Router.put    ("/:id"                , checkId , verfyToken ,photoUpload.single("image"), examController.updateExam       );
Router.patch    ("/:id"                , checkId , verfyToken , examController.activeExam       );
Router.delete ("/:id"                , checkId , verfyToken , examController.deleteExam       );
Router.get    ("/get-all-course/:id" , checkId , verfyToken , examController.getAllExam       );
Router.patch    ("/start-exam-user/:id" , checkId , verfyToken , examController.startExamUser       );
Router.patch    ("/end-exam-user/:id" , checkId , verfyToken , examController.endExamUser       );
module.exports = Router;