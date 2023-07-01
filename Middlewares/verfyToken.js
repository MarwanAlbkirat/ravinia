const jwt = require("jsonwebtoken");
const verfyToken = (req,res,next)=>{
    try {
        const {id} = jwt.verify(req.headers.token,process.env.JWT_SECRET_KEY);
        req.id = id;
        next();
    } catch (error) {
        return res.status(400).json({message:"invalid token"});
    }
}
module.exports =verfyToken;