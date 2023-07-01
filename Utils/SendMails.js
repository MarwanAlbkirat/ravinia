nodemailer = require("nodemailer")
const sendEmail = (to , subject , html)=>{
    const transporter =  nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:process.env.USER_EMAIL,
            pass:process.env.PASS_EMAIL,
        }
    });
    const mailOptios = {
        from :process.env.USER_EMAIL,
        to : to,
        subject : subject,
        html :html
    };
    transporter.sendMail(mailOptios , (error,success)=>{
        if(error)console.log(error);
        else console.log("success "+ success.response);
    });
};
module.exports = sendEmail;