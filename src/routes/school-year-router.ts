import { Router } from "express";
import {
  createSchoolYear,
  editSchoolYear,
  getSchoolYear,
  getSchoolYears,
  getSchoolYearsNoLimited
} from "../controllers/school-year-controller";

export const schoolYearRouter = Router();

schoolYearRouter.post("/new/:center", createSchoolYear);

schoolYearRouter.get("/all/:center", getSchoolYears);
schoolYearRouter.get("/:center", getSchoolYearsNoLimited);

schoolYearRouter.get("/:id", getSchoolYear);
schoolYearRouter.put("/edit/:id", editSchoolYear);
