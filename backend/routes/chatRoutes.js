import express from "express";
import { createChat, getChatById } from "../chat/chatController.js";
import { createMessage, getMessagesByChatId } from "../chat/messageController.js";

const router = express.Router();

router.post("/", createChat);
router.get("/:chatId", getChatById);
router.post("/:chatId/messages", createMessage);
router.get("/:chatId/messages", getMessagesByChatId);

export default router;
