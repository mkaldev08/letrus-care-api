import { Router } from "express";
import {
  createSchoolYear,
  editSchoolYear,
  getSchoolYearById,
  getSchoolYears,
  getCurrentSchoolYear,
  getSchoolYearsNoLimited
} from "../controllers/school-year-controller";

export const schoolYearRouter = Router();

schoolYearRouter.post("/new/:center", createSchoolYear);

schoolYearRouter.get("/all/:center", getSchoolYears);
schoolYearRouter.get("/:center", getSchoolYearsNoLimited);

schoolYearRouter.get("/:id", getSchoolYearById);
schoolYearRouter.get("/current/:center", getCurrentSchoolYear);
schoolYearRouter.put("/edit/:id", editSchoolYear);
