import { Router } from "express";
import {
  createUser,
  loginAccount,
  userLogout,
} from "../controllers/user-controller";
const userRouter = Router();

userRouter.post("/new", createUser);
userRouter.post("/login", loginAccount);
userRouter.post("/logout", userLogout);

export { userRouter };
