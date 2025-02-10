import User from "../models/user.model";
import Message from "../models/message.model";
import cloudinary from "../lib/cloudinary";
import { io, userSocketMap } from "../lib/socket";
import { Request, Response } from "express";
import Conversation from "../models/conversation.model";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error: any) {
    console.error("Error in getAllSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsersForSidebar = async (req: Request, res: Response) => {
  try {
    const loggedInUserId = req.user._id;
    const conversations = await Conversation.find({
      participants: loggedInUserId,
    }).select("participants");

    // Extract the other participant from each conversation
    const userIds = conversations
      .map((conv) =>
        conv.participants.find(
          (p) => p.toString() !== loggedInUserId.toString()
        )
      )
      .filter(Boolean); // Remove undefined values

    // Fetch user details without the password field
    const users = await User.find({ _id: { $in: userIds } }).select(
      "-password"
    );

    res.status(200).json(users);
  } catch (error: any) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  const { id: otherUserId } = req.params;
  const myId = req.user._id;
  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [myId, otherUserId] },
    });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error: any) {
    console.log("Error in getMessages controller: ", error?.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLastMessage = async (req: Request, res: Response) => {
  const { otherUserId, authUserId } = req.params;
  console.log(req.params);

  try {
    const conversation = await Conversation.find({
      participants: { $all: [otherUserId, authUserId] },
    })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!conversation || conversation.length === 0) {
      res.status(404).json({ error: "No conversation found for these users" });
      return;
    }

    const lastMessage = conversation[0].lastMessage;
    res.status(200).json(lastMessage);
  } catch (error: any) {
    console.log("Error in getLastMessages controller: ", error?.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  const userId = req.user._id;
  try {
    const conversations = await Conversation.find({
      participants: userId,
    }).populate({
      path: "participants",
      select: "fullName profilePic",
    });

    conversations.forEach((conv) => {
      conv.participants = conv.participants.filter(
        (p) => p._id.toString() !== userId.toString()
      );
    });
    res.status(200).json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// export const sendMessage = async (req: Request, res: Response) => {
//   try {
//     const { text, image } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;

//     let imageUrl;
//     if (image) {
//       const uploadResponse = await cloudinary.uploader.upload(image);
//       imageUrl = uploadResponse.secure_url;
//     }
//     const newMessage = await Message.create({
//       senderId,
//       receiverId,
//       text,
//       image: imageUrl,
//     });

//     const receiverSocketId = getReceiverSocketId(receiverId);
//     // io.emit sends events to all the connected users. But we used to(id) in the middle. So it will be sent onlyu to the reciever
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", newMessage);
//     }

//     res.status(201).json(newMessage);
//   } catch (error: any) {
//     console.log("Error in sendMessage controller: ", error?.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        lastMessage: {
          text,
          sender: senderId,
        },
      });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      text,
      image: imageUrl,
    });

    await conversation.updateOne({
      lastMessage: {
        text,
        sender: senderId,
      },
    });

    // io.emit sends events to all the connected users. But we used "to(id)" in the middle. So it will be sent only to the reciever
    if (userSocketMap[receiverId]) {
      io.to(userSocketMap[receiverId]).emit("newMessage", newMessage);
      console.log("New Message recieved by ", receiverId);
    }

    res.status(201).json(newMessage);
  } catch (error: any) {
    console.log("Error in sendMessage controller: ", error?.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
