const jwt =require("jsonwebtoken");
const verifyUser = (req,res,next)=>{
    if(!req.headers['token'])return res.status(403).json({message:"you need to logged in"});
    try {
        const {id} = jwt.verify(req.headers['token'] , process.env.JWT_SECRET_KEY);
        if(id !== req.params.id)return res.status(403).json({message:"You only have permissions to edit your account"});
        next();
    } catch (error) {
        res.status(400).json({message:"ivalid token"});
    }
}
module.exports = verifyUser;