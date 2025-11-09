import { Router } from "express";
import { getDashboard, getOverduePayments } from "../controllers/dashboard-controller";

export const dashboardRouter = Router();
dashboardRouter.get("/:centerId", getDashboard);
dashboardRouter.get("/overdue/:centerId", getOverduePayments);
