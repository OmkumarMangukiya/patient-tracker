import express from "express";
import { getMedicinesHandler } from "../utils/medicineData.js";

const router = express.Router();

router.get("/", getMedicinesHandler);

export default router;
