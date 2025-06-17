import asyncHandler from "express-async-handler";
import EncryptedChatKeys from "../models/EncryptedChatKeys";

export const getGroupAesKey = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const user = req.user;

    if (!groupId) {
        return res.status(400).send({ message: "Please provide the groupId params" })
    }

    const groupAesKey = await EncryptedChatKeys.findOne({ chat: groupId, user: user.id || user._id })
    if (!groupAesKey) {
        return res.status(404).json({ message: "Key not found for chat" })
    }

    res.status(200).json({ key: groupAesKey })
})

export const addGroupAesKey = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const user = req.user;

    if (!groupId) {
        return res.status(400).send({ message: "Please provide the groupId params" })
    }

    const groupAesKey = await EncryptedChatKeys.create({ chat: groupId, user: user.id || user._id, key: req.body })
    res.status(200).json({ message: "AES key successfully added.", key: groupAesKey })
})