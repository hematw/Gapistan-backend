import { Router } from 'express';
import authRouter from './auth.routes.js';
import chatRouter from './chat.routes.js';
import usersRouter from './user.routes.js';
import keysRouter from './keys.routes.js';
import livekitRouter from './livekit.routes.js';

const mainRouter = Router();

mainRouter.use('/auth', authRouter);
mainRouter.use('/chats', chatRouter);
mainRouter.use('/users', usersRouter);
mainRouter.use('/keys', keysRouter);
mainRouter.use('/livekit', livekitRouter)

export default mainRouter;