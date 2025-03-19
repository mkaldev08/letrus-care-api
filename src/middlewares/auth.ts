import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user-model";
const secret = process.env.JWT_TOKEN;

export const withAuth = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  const token = request.cookies?.token;
  if (!token) {
    response.status(401).json({ error: "Unauthorized: no token provided" });
    return;
  }

  if (!secret) {
    console.error("JWT secret not provided");
    response.status(500).json({ error: "Internal Server Error" });
    return;
  }

  try {
    type decodedType = {
      username: string;
      iat: number;
      exp: number;
    };
    const decoded = jwt.verify(token, secret);
    if (!decoded) {
      console.error("Token verification error");
      response.status(401).json({ error: "Unauthorized: Token Invalid!" });
      return;
    }

    const user = await UserModel.findOne({
      username: (decoded as decodedType)?.username,
    });

    if (!user) {
      response.status(401).json({ error: "Unauthorized: User not found" });
      return;
    }
    next();
  } catch (error) {
    console.error("Unexpected error during token verification:", error);
    response.status(500).json({ error: "Internal Server Error" });
    return;
  }
};
