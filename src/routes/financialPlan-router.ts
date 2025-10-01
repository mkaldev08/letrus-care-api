import { Router } from "express";
import {
  generateFinancialPlan,
  getFinancialPlan,
} from "../controllers/financialPlans-controller";

export const financialPlanRouter = Router();
/* financialPlanRouter.post(
  "/new/:centerId/enrollment/:enrollmentId",
  generateFinancialPlan
); */

financialPlanRouter.get(
  "/:centerId/enrollment/:enrollmentId",
  getFinancialPlan
);
