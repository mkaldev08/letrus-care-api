import { Router } from "express";
import { getDashboard, getOverduePayments, getOverduePaymentsWithoutLimitePerPage } from "../controllers/dashboard-controller";

export const dashboardRouter = Router();
dashboardRouter.get("/:centerId/:schoolYearId", getDashboard);
dashboardRouter.get("/overdue/:centerId/:schoolYearId", getOverduePayments);
dashboardRouter.get("/overdue-without-limit/:centerId/:schoolYearId", getOverduePaymentsWithoutLimitePerPage);
