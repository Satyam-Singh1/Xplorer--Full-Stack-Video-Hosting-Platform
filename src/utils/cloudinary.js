import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


  // Configuration
  cloudinary.config({ 
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
      api_key:process.env.CLOUDINARY_API_KEY,
      api_secret:process.env.CLOUDINARY_API_SECRET
  });


  const uploadOnCloudinary = async(localFilePath)=>{
    try {
         if(!localFilePath){return null;}
         //if filepathavailabe upload the file to cloudinary
    const response =  await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
      })

      //If file has been uploaded successfully 
      // console.log("File is uploaded on cloudinary", response.url);
      fs.unlinkSync(localFilePath);
      return response;

    } catch (error) {
       fs.unlinkSync(localFilePath) //after uploading remove the locally saved file as upload operation got failed
    }
  }

  export {uploadOnCloudinary}