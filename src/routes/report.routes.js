import express from "express";
import { createReport, deleteReport, getReports, updateReportStatus } from "../controllers/report.controller.js";
import authenticate, { isAdmin } from "../middlewares/auth-handler.js";

const reportsRouter = express.Router();

reportsRouter.use(authenticate);

reportsRouter.post("/", createReport);

reportsRouter.use(isAdmin);

reportsRouter.get("/", getReports);

reportsRouter.patch("/:reportId/status", updateReportStatus);

reportsRouter.delete("/:reportId", deleteReport);

export default reportsRouter;
