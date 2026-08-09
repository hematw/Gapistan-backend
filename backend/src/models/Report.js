import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "reviewed", "resolved"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Report", reportSchema);
