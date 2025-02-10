import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongo = await mongoose.connect(process.env.MONGODB_URL as string);
    console.log(`MongoDb Connected: ${mongo.connection.host}`);
  } catch (error) {
    console.log("MongoDB Connectin Error: ", error);
  }
};
