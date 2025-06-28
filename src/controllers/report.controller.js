import asyncHandler from "express-async-handler";
import Report from "../models/Report.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

export const createReport = asyncHandler(async (req, res) => {
    const reporter = req.user.id;
    const { reportedUser, reportedMessage, reason, details } = req.body;
    if (!reason || (!reportedUser && !reportedMessage)) {
        return res.status(400).json({ message: "Reason and at least one of reportedUser or reportedMessage are required." });
    }
    const report = await Report.create({
        reporter,
        reportedUser,
        reportedMessage,
        reason,
        details,
    });
    res.status(201).json({ message: "Report submitted.", report });
});

export const getReports = asyncHandler(async (req, res) => {
    // Only admin should access this in real app
    const reports = await Report.find()
        .populate("reporter", "firstName lastName username email")
        .populate("reportedUser", "firstName lastName username email")
        .populate("reportedMessage");
    res.status(200).json({ reports });
});

export const updateReportStatus = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required." });
    const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
    if (!report) return res.status(404).json({ message: "Report not found." });
    res.status(200).json({ message: "Report status updated.", report });
});
