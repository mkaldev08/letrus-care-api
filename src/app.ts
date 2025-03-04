import express, { Application } from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import "./config/database";

import { withAuth } from "./middlewares/auth";

import { userRouter } from "./routes/user-router";
import { studentRouter } from "./routes/student-router";
import { courseRouter } from "./routes/course-router";
import { enrollmentRouter } from "./routes/enrollment-route";
import { gradeRouter } from "./routes/grade-router";
import { paymentRouter } from "./routes/payment-router";
import { classRouter } from "./routes/class-router";
import { teacherRouter } from "./routes/teacher-router";
import { attendanceRouter } from "./routes/attendance-router";
import { centerRouter } from "./routes/center-router";

const app: Application = express();

app.use(cors({ credentials: true, origin: process.env.APP_URL }));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/users", userRouter);
app.use("/centers", withAuth, centerRouter);
app.use("/students", withAuth, studentRouter);
app.use("/courses", withAuth, courseRouter);
app.use("/enrollments", withAuth, enrollmentRouter);
app.use("/grades", withAuth, gradeRouter);
app.use("/payments", withAuth, paymentRouter);
app.use("/classes", withAuth, classRouter);
app.use("/teachers", withAuth, teacherRouter);
app.use("/attendances", withAuth, attendanceRouter);

export default app;
