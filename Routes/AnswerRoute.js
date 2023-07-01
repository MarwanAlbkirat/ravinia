const Router = require("express").Router();
const answerController = require("../Controllers/AnswerController");
const verfyToken = require("../Middlewares/verfyToken");
const checkId = require("../Middlewares/CheckId");
Router.post  ("/"        , verfyToken    ,         answerController.solveAnswer      );
Router.get  ("/:id"      ,checkId  ,  verfyToken,           answerController.getSolve      );
module.exports = Router;