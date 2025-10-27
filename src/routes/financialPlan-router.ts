import { Router } from "express";
import { getFinancialPlan } from "../controllers/financialPlans-controller";

export const financialPlanRouter = Router();
/* financialPlanRouter.post(
  "/new/:centerId/enrollment/:enrollmentId",
  generateFinancialPlan
); */

financialPlanRouter.get(
  "/:centerId/enrollment/:enrollmentId",
  getFinancialPlan
);
