const express = require('express');
const app = express();
const dotenv = require("dotenv").config();
const connect = require("./Confiq/ConnectToDatabase");
const {errorHandler,notFound} = require("./Middlewares/Error");
const xss = require("xss-clean");
const rateLimit  = require("express-rate-limit");
const helmet  = require("helmet");
const hpp = require("hpp");
// Connect to database
connect();

// security headres
app.use(helmet());

// prevent param pollution 
app.use(hpp());
// prevent xss atacks
app.use(xss());
app.use(rateLimit({
    windowMs:10*60 *1000,
    max:300,
}));
// Allow to accepting frontend requests
const cors = require('cors');
app.use(cors({
    origin:"http://localhost:3000"
})); 

// Allow accepting json data
app.use(express.json());

// Routes
app.use("/api/authentication"   , require("./Routes/AuthenticationRoute" ));
app.use("/api/users"            , require("./Routes/UsersRoute"          ));
app.use("/api/course"           , require("./Routes/CourseRoute"         ));
app.use("/api/exam"             , require("./Routes/ExamRoute"           ));
app.use("/api/question"         , require("./Routes/QuestionRoute"       ));
app.use("/api/answer"           , require("./Routes/AnswerRoute"         ));

// Api not found
app.use(notFound);

// Error Message
app.use(errorHandler);

// Server setup
app.listen(process.env.PORT || 8000,
    ()=>console.log(
`welcome to ravinia project
this project in ${process.env.NODE_ENV}
run on port ${process.env.PORT}
created by Marwan Albkirat`));