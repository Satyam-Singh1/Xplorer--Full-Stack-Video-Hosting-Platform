import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    //Updated the refresh token to db
    user.refreshToken = refreshToken

    //save the updation using save() method 
    //save() method everytime wants to check the required fied as password and all to pause that we can set validateBeforeSave() : a built in method to false.

    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "Something went wrong!! while generating tokens")
  }
}

const registerUser = asyncHandler(async (req, res) => {


  //get user detail from our forntend register user page 
  const { fullName, email, username, password } = req.body


  //Validate the recieved data - not empty

  //Traditional way of validating
  //  if(fullName===""){
  //    throw new ApiError(400 , "Full name is required") 
  // }

  //Modern way
  if (
    [fullName, email, username, password].some((field) =>
      field?.trim() == "")
  ) {
    //Using my predefined template to throw error
    throw new ApiError(400, "All fields are required")
  }
  //Check whether the user present in database or not --> Either email or username for that we are using a modern technique using or

  //check if user already exists -- > either check email or username from our database
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  //check for images  ,avatar

  const avatarLocalServerPath = req.files?.avatar[0]?.path;
  const coverImageLocalServerPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalServerPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //Upload them to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalServerPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalServerPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //create user object - create entry in db call
  const user = await User.create({
    fullName: fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email: email,
    password: password,
    username: username.toLowerCase()
  })

  //remove password and refresh token field form response
  const isCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  )


  //check for user creation
  if (!isCreated) {
    throw new ApiError(500, "Something went wrong!! while registering the user")
  }

  //Im using preDefined template for sending each response
  //return res

  return res.status(201).json(
    new ApiResponse(200, isCreated, "User registered Successfully")
  )


})

const loginUser = asyncHandler(async (req, res) => {

  //Take user data
  const { username, email, password } = req.body
  //Validate it
  if (!(username || email)) {
    throw new ApiError(400, "Username or  email is required!")
  }

  //Find user whether present in db or not
  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError(404, "User does not exist!")
  }

  //Match the password
  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new ApiError(401, "Password does not match")
  }


  //generate tokens --> access and refresh tokes

  //We'll doing this frequently so we can create seperate function for that

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  //Send tokens to user as cookies

  //Taking data from db to send it to user in form of cookies.
  //But we did not want to send each and every user data, we did not want to send  user passsword and refresh token.
  //so remove them using .select() method
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200).cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User loggedIn successfully"
      )
    )


})

const logoutUser = asyncHandler(async (req, res) => {
  //find user in db using its id
  const id =
  await User.findByIdAndUpdate( 
    req.user._id,
    {
      $set: { refreshToken: undefined }
    },
    {
      new: true,
      
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out!!"))
})


const refreshAccessToken =asyncHandler(async (req,res)=>{
   const incomingRefreshToken =   req.cookies.refreshToken || req.body.refreshToken
   
   if(!incomingRefreshToken){
    throw new ApiError(401 , "Unauthorized request !!")
   }
try {
  
    const decodedToken =  jwt.verify(
      incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET
     )
  
       const user  = await User.findById(decodedToken?._id)
       if(!user){
        throw new ApiError(401 , "Invalid refresh TOken")
       }
       
       if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401 , "Refresh Token is Expired or used!!")
       }
       
       const options = {
         httpOnly : true,
         secure:true
       }
  
      const {accessToken , newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
      return res
      .status(200)
      .cookie("accessToken",accessToken , options)
      .cookie("refreshToken",newrefreshToken , options)
       .json(new ApiResponse(200,
        {accessToken , newrefreshToken }, 
        "Access Token Refreshed"))
  
} catch (error) {
   throw new ApiError(400 , error?.message || "Invalid refresh token!!")
}
})


const changeCurrentPassword = asyncHandler(async(req , res)=>{
   const {oldPassword , newPassword} = req.body

  const user = await User.findById(req.user?._id);
     
 const isPasswordCorrect =  user.isPasswordCorrect(oldPassword)

 if(!isPasswordCorrect){
  throw new ApiError(400 , "Invalid old password")
 }

 user.password = newPassword
await user.save({validateBeforeSave:false})
 
res.status(200)
.json(new ApiResponse(200 ,"Password Changed Successfully!!")
)

})

const getCurrentUser = asyncHandler(async(req ,res)=>{
  //as the middleware is injection the whole user in req before calling next()
  return res.status(200)
  .json(200 , req.user , "Current user fetched Successfully!!")
})

const updateAccountDetails = asyncHandler(async(req , res)=>{
  const {fullName , email} = req.body
  
  if(!fullName || !email){
    throw new ApiError(400 , "All fields are required!")
  }

  //the findByIdAndUpdate() method takes three parameters 
  /*
   1. user id which has to be updated.
   2. 
   3. new:true  -> means the updated user is returned
  */
     const user =  User.findByIdAndUpdate(
        req.user?._id,
        {
          $set:{
            fullName:fullName,
            email:email
          }
        },
        {new:true}
      ).select("-password")
      return res.status(200)
      .json(new ApiResponse(200 , user ,"Account details successfully!!"))
})

const updateUserAvatar = asyncHandler(async(req , res)=>{
    const avatarLocalPath =  req.file?.path
   
    if(!avatarLocalPath){
      new ApiError(400,"Avatar file is missing")
    }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   
   if(!avatar.url){
    new ApiError(400,"Error while uploading the avatar!!")
  }
  
 const user=await User.findByIdAndUpdate(req.user._id,
    {
      $set:{
        avatar : avatar.url
      },
    },
    {new:true}
  ).select("-password")
  res.status(200)
  .json(new ApiResponse(200,user,"Avatar Image updated successfully"))
})
const updateUserCoverImage = asyncHandler(async(req , res)=>{
    const coverImageLocalPath =  req.file?.path
   
    if(!coverImageLocalPath){
      new ApiError(400,"Cover Image file is missing")
    }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   
   if(!coverImage.url){
    new ApiError(400,"Error while uploading the avatar!!")
  }
  
 const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set:{
        avatar : coverImage.url
      },
    },
    {new:true}
  ).select("-password")
    
  res.status(200)
  .json(new ApiResponse(200,user,"Cover Image updated successfully"))

})

export { registerUser, loginUser, logoutUser , refreshAccessToken ,getCurrentUser , changeCurrentPassword , updateAccountDetails , updateUserAvatar ,updateUserCoverImage }