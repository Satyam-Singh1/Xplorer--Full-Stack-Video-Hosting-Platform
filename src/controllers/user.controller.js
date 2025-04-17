import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async(req ,res)=>{
   //get user detail from our forntend register user page 

   //Validate the recieved data - not empty

   //check if user already exists -- > either check email or username from our database


   //remove password and refresh token field form response

   
   //check for user creation
   //return res
   
   const {fullName , email , username , password } = req.body
   console.log(fullName , email)
   

   //Traditional way of validating
   //  if(fullName===""){
   //    throw new ApiError(400 , "Full name is required") 
   // }

   //Modern way
   if(
      [fullName , email,username,password].some((field)=>
         field?.trim()=="")
   ){
      //Using my predefined template to throw error
       throw new ApiError(400 , "All fields are required")
   }
   //Check whether the user present in database or not --> Either email or username for that we are using a modern technique using or
  const existedUser =  User.findOne({
      $or:[{ username },{ email }]
    })
    
    if(existedUser){
      throw new ApiError(409,"User with mail or username already exists!")
    }

 //check for images  ,avatar
   
 const avatarLocalServerPath = req.files?.avatar[0]?.path;
 const coverImageLocalServerPath = req.files?.coverImage[0]?.path;

 if(!avatarLocalServerPath){
   throw new ApiError(400 , "Avatar file is required");
 }
  
 //Upload them to cloudinary
 const avatar = await uploadOnCloudinary(avatarLocalServerPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalServerPath);

 if(avatar){
   throw new ApiError(400 , "Avatar file is required");
 }

 //create user object - create entry in db call
 const user = await User.create({
   fullName:fullName,
   avatar:avatar.url,
   coverImage:coverImage?.url||"",
   email:email,
   password:password,
   username:username.toLowerCase()
   })

  const isCreated = await User.findById(user._id).select(
   "-password -refreshToken"
  )
  
  if(!isCreated){
    throw new ApiError(500 , "Something went wrong!! while registering the user")
  }

  //Im using preDefined template for sending each response
 return res.status(201).json(
   new ApiResponse(200 , isCreated , "User registered Successfully" )
 )


})

export {registerUser}