import asyncHandler from "express-async-handler";
import Report from "../models/Report.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

export const createReport = asyncHandler(async (req, res) => {
    const reporter = req.user.id;
    const { reportedUser, reason } = req.body;
    if (!reason || (!reportedUser && !reportedMessage)) {
        return res.status(400).json({ message: "Reason and at least one of reportedUser or reportedMessage are required." });
    }
    const report = await Report.create({
        reporter,
        reportedUser,
        reason,
    });
    res.status(201).json({ message: "Report submitted.", report });
});

export const getReports = asyncHandler(async (req, res) => {
    // Only admin should access this in real app

    // Search by reason or reporter/reportedUser username/email
    const { search = "", page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
        query.$or = [
            { reason: { $regex: search, $options: "i" } },
        ];
    }

    // Find users matching the search for reporter/reportedUser
    if (search) {
        const users = await User.find({
            $or: [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
            ]
        }).select("_id");
        const userIds = users.map(u => u._id);
        if (userIds.length) {
            query.$or = [
                ...(query.$or || []),
                { reporter: { $in: userIds } },
                { reportedUser: { $in: userIds } }
            ];
        }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
        Report.find(query)
            .populate("reporter", "firstName lastName username email")
            .populate("reportedUser", "firstName lastName username email")
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 }),
        Report.countDocuments(query)
    ]);

    res.status(200).json({ reports, total, page: parseInt(page), limit: parseInt(limit) });
});

export const updateReportStatus = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required." });
    const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
    if (!report) return res.status(404).json({ message: "Report not found." });
    res.status(200).json({ message: "Report status updated.", report });
});

export const deleteReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const report = await Report.findByIdAndDelete(reportId);
    if (!report) return res.status(404).json({ message: "Report not found." });
    res.status(200).json({ message: "Report rejected and deleted." });
});