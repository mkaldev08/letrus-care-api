import { Router } from "express";
import { generateFinancialPlan } from "../controllers/financialPlans-controller";

export const financialPlanRouter = Router();
financialPlanRouter.post(
  "/new/:centerId/enrollment/:enrollmentId",
  generateFinancialPlan
);
