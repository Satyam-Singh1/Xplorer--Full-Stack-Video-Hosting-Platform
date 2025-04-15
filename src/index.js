
import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
  path:'./env'
})
const PORT = process.env.PORT;

connectDB()
.then(()=>{
   app.listen(PORT || 8000 , ()=>{
    console.log(`Server is Runnig at ${PORT}`)
   })
   app.on("error",(error)=>{
    console.log("Error" , error)
        throw error
   })
})
.catch((err)=>{
  console.log("MONGO DB connection failed!!",err);
})





/*
const app = express();
async function connecDB(){
   try {
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      app.on("error", (error)=>{
        console.log("Error" , error)
        throw error
      })
      
      app.listen(PORT,()=>{
      
      })
    

   } catch (error) {
    console.log("Error", error)
   }
}
   */