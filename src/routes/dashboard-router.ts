import { Router } from "express";
import {
  getDashboard,
  getOverduePayments,
  getOverduePaymentsWithoutLimitePerPage,
  getDailyPayments,
  getDailyPaymentsWithoutLimit,
  getActiveStudents,
  getActiveStudentsWithoutLimit,
  getDailyAbsences,
  getDailyAbsencesWithoutLimit,
  getDailyEnrollments,
  getDailyEnrollmentsWithoutLimit,
  getIncompleteEnrollments,
  getIncompleteEnrollmentsWithoutLimit,
} from "../controllers/dashboard-controller";

export const dashboardRouter = Router();
dashboardRouter.get("/:centerId/:schoolYearId", getDashboard);
dashboardRouter.get("/overdue/:centerId/:schoolYearId", getOverduePayments);
dashboardRouter.get("/overdue-without-limit/:centerId/:schoolYearId", getOverduePaymentsWithoutLimitePerPage);
dashboardRouter.get("/daily-payments/:centerId/:schoolYearId", getDailyPayments);
dashboardRouter.get("/daily-payments-without-limit/:centerId/:schoolYearId", getDailyPaymentsWithoutLimit);
dashboardRouter.get("/active-students/:centerId", getActiveStudents);
dashboardRouter.get("/active-students-without-limit/:centerId", getActiveStudentsWithoutLimit);
dashboardRouter.get("/daily-absences/:centerId/:schoolYearId", getDailyAbsences);
dashboardRouter.get("/daily-absences-without-limit/:centerId/:schoolYearId", getDailyAbsencesWithoutLimit);
dashboardRouter.get("/daily-enrollments/:centerId/:schoolYearId", getDailyEnrollments);
dashboardRouter.get("/daily-enrollments-without-limit/:centerId/:schoolYearId", getDailyEnrollmentsWithoutLimit);
dashboardRouter.get("/incomplete-enrollments/:centerId/:schoolYearId", getIncompleteEnrollments);
dashboardRouter.get("/incomplete-enrollments-without-limit/:centerId/:schoolYearId", getIncompleteEnrollmentsWithoutLimit);

