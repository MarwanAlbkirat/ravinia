const cloudinary = require("cloudinary");
cloudinary.config({
    cloud_name :process.env.CLOUDINARY_CLOUD_NAME,
    api_key :process.env.CLOUDINARY_API_KEY,
    api_secret :process.env.CLOUDINARY_API_SECRET,
});
const cloudinaryUploadImage = async(fileToUplad)=>{
    try {
        const data = await cloudinary.uploader.upload(fileToUplad,{
            resource_type:'auto',
        });
        return data;
    } catch (error) {
        throw new Error("server error (cloudinary)");
    }
}
const cloudinaryRemoveImage = async(imagePublicId)=>{
    try {
        const result = await cloudinary.uploader.destroy(imagePublicId);
    } catch (error) {
        throw new Error("server error (cloudinary)");
    }
}
module.exports = {cloudinaryUploadImage,cloudinaryRemoveImage};