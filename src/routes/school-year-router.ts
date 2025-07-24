import { Router } from "express";
import {
  createSchoolYear,
  editSchoolYear,
  getSchoolYear,
  getSchoolYears,
} from "../controllers/school-year-controller";

export const schoolYearRouter = Router();
schoolYearRouter.post("/new", createSchoolYear);

schoolYearRouter.get("/all/", getSchoolYears);
schoolYearRouter.get("/:id", getSchoolYear);
schoolYearRouter.put("/edit/:id", editSchoolYear);
