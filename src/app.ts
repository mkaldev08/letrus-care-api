import express, { Application } from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

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
import { dashboardRouter } from "./routes/dashboard-router";
import {healthCheckRouter} from "./routes/health-check-router";

const app: Application = express();

app.use(cors({ credentials: true, origin: process.env.APP_URL }));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.disable("x-powered-by");

const options = {
  failOnErrors: true, // 500
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Letrus Care API",
      description: "API for Letrus Care",
      version: "0.1.0",
    },
    license: {
      name: "MIT",
      url: "https://github.com/manuelkalueka/letrus-care-api/blob/master/LICENSE",
    },
    contact: {
      name: "Manuel Kalueka",
      url: "https://github.com/manuelkalueka",
    },
    security: {
      cookieAuth: [
        {
          type: "apiKey",
          name: "token",
          in: "cookie",
        },
      ],
    },
  },
  apis: ["./routes/*.ts"],
};

const openapiSpecification = swaggerJsdoc(options);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpecification));

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
app.use("/dashboard", withAuth, dashboardRouter);
app.use("/health-check", healthCheckRouter);

export default app;
