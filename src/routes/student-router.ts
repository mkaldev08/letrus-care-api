import { Router } from "express";
import {
  createStudent,
  deleteStudent,
  editStudent,
  getActiveStudents,
  getStudent,
  getStudents,
  getStudentsWithPagination,
  searchStudent,
} from "../controllers/student-controller";

export const studentRouter = Router();
studentRouter.post("/new", createStudent);

studentRouter.get("/all", getStudents);
studentRouter.get("/active/:centerId", getActiveStudents);
studentRouter.get("/paginated/:centerId", getStudentsWithPagination);
studentRouter.get("/:id", getStudent);
studentRouter.get("/search/:centerId", searchStudent);
studentRouter.put("/edit/:id", editStudent);
studentRouter.patch("/delete/:id", deleteStudent);
