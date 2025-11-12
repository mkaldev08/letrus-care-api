import { Router } from "express";
import { getDashboard, getOverduePayments, getOverduePaymentsWithoutLimitePerPage } from "../controllers/dashboard-controller";

export const dashboardRouter = Router();
dashboardRouter.get("/:centerId", getDashboard);
dashboardRouter.get("/overdue/:centerId", getOverduePayments);
dashboardRouter.get("/overdue-without-limit/:centerId", getOverduePaymentsWithoutLimitePerPage);
