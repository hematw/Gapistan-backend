import mongoose from "mongoose";

const EncryptedChatKeySchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    key: {
        type: Object,
        required: true
    }
}, { timestamps: true })

export default mongoose.model("EncryptedChatKey", EncryptedChatKeySchema)