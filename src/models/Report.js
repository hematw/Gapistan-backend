import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportedMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    reason: { type: String, required: true },
    details: { type: String },
    status: { type: String, enum: ["pending", "reviewed", "resolved"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Report", reportSchema);
