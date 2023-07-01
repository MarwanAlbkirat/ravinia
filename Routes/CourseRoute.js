const Router = require("express").Router();
const verfyToken = require("../Middlewares/verfyToken");
const CheckId = require("../Middlewares/CheckId");
const courseController = require("../Controllers/CourseController");
const photoUpload = require("../Middlewares/PhotoUpload");

Router.get    ("/"                                   , verfyToken , courseController.getAllCourses        );
Router.get    ("/:id"                      , CheckId , verfyToken , courseController.getSpecificCourse    );
Router.post   ("/"                                   , verfyToken , courseController.createCourse         );
Router.put    ("/:id"                      , CheckId , verfyToken , courseController.updateCourse         );
Router.delete ("/:id"                      , CheckId , verfyToken , courseController.deleteCourse         );
Router.patch  ("/add-user-course/:id"      , CheckId , verfyToken , courseController.addUserToCourse      );
Router.delete ("/remove-user-course/:id"   , CheckId , verfyToken , courseController.removeUserFromCourse );
Router.post   ("/course-photo-upload/:id"  , CheckId , verfyToken ,photoUpload.single("image"), courseController.profilePhoto         );
module.exports = Router;