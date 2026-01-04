import { Router } from "express";
import {
  createClass,
  getClass,
  editClass,
  getClasses,
  updateClassStatus,
  addStudentsOnClass,
} from "../controllers/class-controller";
const classRouter = Router();

classRouter.post("/new", createClass);
classRouter.get("/all/:centerId/:schoolYearId", getClasses);
classRouter.get("/:id", getClass);
classRouter.put("/edit/:id", editClass);
classRouter.put("/add-student/:id", addStudentsOnClass);
classRouter.patch("/:id/status", updateClassStatus);
export { classRouter };
