const Router = require("express").Router();
const userController = require("../Controllers/AuthenticationController");
const verfyToken = require("../Middlewares/verfyToken");

Router.post  ("/register"        ,              userController.register       );
Router.post  ("/login"           ,              userController.login          );
Router.patch ('/verifyEmail'     , verfyToken , userController.verifyEmail    );
Router.post  ('/forgot-password' ,              userController.forgotPassword );
Router.patch ('/reset-password'  , verfyToken , userController.resetPassword  );
module.exports = Router;