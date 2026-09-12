import express from "express";
import signup from "../auth/signup.js";
import signin from "../auth/signin.js";
import setPassword from "../auth/setPassword.js";
import forgotPassword from "../auth/forgotPassword.js";
import resetPassword from "../auth/resetPassword.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/set-password", setPassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
