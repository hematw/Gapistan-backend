import { Router } from "express"
import { addGroupAesKey, getGroupAesKey } from "../controllers/keys.controller.js";
import authHandler from "../middlewares/auth-handler.js";

const keysRouter = Router();

keysRouter.use(authHandler)
keysRouter.get("/aes-key/:groupId", getGroupAesKey)
keysRouter.post("/aes-key/:groupId", addGroupAesKey)


export default keysRouter;