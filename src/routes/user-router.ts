import { Router } from "express";
import {
  createUser,
  findUser,
  loginAccount,
  userLogout,
  verifyOTPCode,
} from "../controllers/user-controller";
const userRouter = Router();

userRouter.post("/new", createUser);
userRouter.post("/login", loginAccount);
userRouter.post("/logout", userLogout);
userRouter.get("/find/:username", findUser);
userRouter.post("/verify/:userId", verifyOTPCode);

export { userRouter };
