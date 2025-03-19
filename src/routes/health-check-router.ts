import express, { Request, Response } from "express";

const healthCheckRouter = express.Router();

healthCheckRouter.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: "API is running" });
});

export { healthCheckRouter };
