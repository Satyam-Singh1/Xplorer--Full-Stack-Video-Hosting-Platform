
import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
  path:'./env'
})

connectDB();

const PORT = process.env.PORT;

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
        console.log(`Server is started on ${PORT}`)
      })
    

   } catch (error) {
    console.log("Error", error)
   }
}
   */