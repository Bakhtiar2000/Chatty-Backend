import express, { Application } from "express";
import { authRoutes } from "./routes/auth.route";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./lib/db";
import { messageRoutes } from "./routes/message.route";
import cors from "cors";
import { app, server } from "./lib/socket";

dotenv.config();
const port = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
  connectDB();
});

export default app;
