const Router = require("express").Router();
const userController = require("../Controllers/UsersController");
const verifyAdmin = require("../Middlewares/verfyAdmin");
const verifyUser = require("../Middlewares/verifyUser");
const checkId = require("../Middlewares/CheckId");
const verifyAdminAndUser = require("../Middlewares/verifyAdminAndUser");
const verfyToken = require("../Middlewares/verfyToken");
const photoUpload = require("../Middlewares/PhotoUpload");

Router.get    ("/"                     , verifyAdmin                               , userController.getAllUsers             );
Router.get    ("/:id"                  , checkId     , verifyAdminAndUser          , userController.getSpecificUser         );
Router.put    ("/:id"                  , checkId     , verifyUser                  , userController.updateUser              );
Router.delete ("/:id"                  , checkId     , verifyAdminAndUser          , userController.deleteUser              );
Router.patch  ("/permission/:id"       , checkId     , verifyAdmin                 , userController.setAndRemovePermission  );
Router.post   ("/profile-photo-upload" , verfyToken  , photoUpload.single("image") , userController.profilePhoto            );
module.exports = Router;