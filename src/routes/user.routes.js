
import { Router } from 'express';
import { getPublicKey, getUsers, updateUser, uploadPublicKey, uploadRSAPublicKey } from '../controllers/users.controller.js';
import upload from '../utils/multer.js';
import authHandler from '../middlewares/auth-handler.js';

const usersRouter = Router();

usersRouter.use(authHandler)
usersRouter.get('/', getUsers)
usersRouter.put("/public-key", uploadPublicKey);
usersRouter.put("/rsa-public-key", uploadRSAPublicKey);
usersRouter.put("/:id", upload.single("profile"), updateUser)
usersRouter.get("/:id/public-key", getPublicKey);
usersRouter.get("/rsa-public-key", getPublicKey);

export default usersRouter;