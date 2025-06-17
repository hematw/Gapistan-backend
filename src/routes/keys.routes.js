import { Router } from "express"
import { addGroupAesKey, getGroupAesKey } from "../controllers/keys.controller";

const keysRouter = Router();

keysRouter.get("aes-key/:groupId", getGroupAesKey)
keysRouter.post("aes-key/:groupId", addGroupAesKey)


export default keysRouter;