import express from "express";
import { createReport, getReports, updateReportStatus } from "../controllers/report.controller.js";
import authenticate from "../middlewares/auth-handler.js";

const reportsRouter = express.Router();

reportsRouter.use(authenticate);

reportsRouter.post("/", createReport);

reportsRouter.get("/", getReports);

reportsRouter.patch("/:reportId/status", updateReportStatus);

export default reportsRouter;
