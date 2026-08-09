import mongoose from "mongoose";

const encryptedChatKeySchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    key: {
      type: Buffer,
      required: true,
    },
  },
  { timestamps: true }
);

encryptedChatKeySchema.index({ chat: 1, user: 1 }, { unique: true });

const EncryptedChatKey = mongoose.model(
  "EncryptedChatKey",
  encryptedChatKeySchema
);

export default EncryptedChatKey;
