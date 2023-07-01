const jwt = require("jsonwebtoken");
const verifyAdminAndUser = (req,res,next)=>{
    try {
        if(!req.headers.token)return res.status(403).json({message:"you need to logged in"});
        const {isAdmin ,id} = jwt.verify(req.headers.token,process.env.JWT_SECRET_KEY);
        if(isAdmin || id === req.params.id)return next();
        return res.status(401).json({message:"You are not authorized"});
        
    } catch (error) {
        res.status(400).json({message:"ivalid token"});
    }
}
module.exports = verifyAdminAndUser;