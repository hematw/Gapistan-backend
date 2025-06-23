// routes/livekit.js
import express from "express";
import { getLivekitToken } from "../controllers/livekit.controller.js";

const livekitRouter = express.Router();

livekitRouter.get("/get-livekit-token", getLivekitToken);

export default livekitRouter;
