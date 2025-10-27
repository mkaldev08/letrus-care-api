import { Router } from "express";
import {
  changeStatus,
  createEnrollment,
  editEnrollment,
  getEnrollment,
  getEnrollmentByStudentId,
  getStudentsForAddOnClass,
  getEnrollments,
  searchEnrollments,
} from "../controllers/enrollment-controller";
import { uploadDiskDocs } from "../config/multer";

export const enrollmentRouter = Router();
const configUpload = uploadDiskDocs.fields([
  { name: "doc_file", maxCount: 1 },
  { name: "image_file", maxCount: 1 },
]);

enrollmentRouter.post("/new", configUpload, createEnrollment);
enrollmentRouter.get("/all/:centerId", getEnrollments);
enrollmentRouter.get("/:id", getEnrollment);
enrollmentRouter.get("/student/:studentId", getEnrollmentByStudentId);
enrollmentRouter.get("/add-class/:centerId", getStudentsForAddOnClass);
enrollmentRouter.get("/search/:centerId", searchEnrollments);

enrollmentRouter.put("/edit/:id", editEnrollment);
enrollmentRouter.patch("/status/:id", changeStatus);
