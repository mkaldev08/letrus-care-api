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
import { enrollmentRouter } from "./routes/enrollment-router";
import { gradeRouter } from "./routes/grade-router";
import { paymentRouter } from "./routes/payment-router";
import { classRouter } from "./routes/class-router";
import { teacherRouter } from "./routes/teacher-router";
import { attendanceRouter } from "./routes/attendance-router";
import { centerRouter } from "./routes/center-router";
import { dashboardRouter } from "./routes/dashboard-router";
import { schoolYearRouter } from "./routes/school-year-router";
import { financialPlanRouter } from "./routes/financialPlan-router";

import { healthCheckRouter } from "./routes/health-check-router";

const app: Application = express();

const allowedOrigins = [
  process.env.APP_URL1,
  process.env.APP_URL2,
] as string[];

app.use(cors({ credentials: true, origin: allowedOrigins }));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.disable("x-powered-by");

// Cookie parser só quando necessário
app.use((req, res, next) => {
  if (req.headers.cookie) {
    cookieParser()(req, res, next);
  } else {
    next();
  }
});

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
app.use("/school-year", withAuth, schoolYearRouter);
app.use("/financial-plan", withAuth, financialPlanRouter);

app.use("/health-check", healthCheckRouter);

export default app;
