import express from "express";
import {
  getAllUsers,
  getConversations,
  getLastMessage,
  getMessages,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/message.controller";
import { protectedRoute } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/", protectedRoute, getAllUsers);
router.get("/users", protectedRoute, getUsersForSidebar);
router.get("/:id", protectedRoute, getMessages);
router.get(
  "/last-message/:otherUserId/:authUserId",
  protectedRoute,
  getLastMessage
);
router.post("/send/:id", protectedRoute, sendMessage);
router.get("/conversations", protectedRoute, getConversations);

export const messageRoutes = router;
