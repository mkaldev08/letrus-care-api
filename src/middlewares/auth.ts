import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user-model";
const secret = process.env.JWT_TOKEN;

export const withAuth: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const token = request.cookies?.token;
  if (!token) {
    return response
      .status(401)
      .json({ error: "Unauthorized: no token provided" });
  }

  if (!secret) {
    console.error("JWT secret not provided");
    return response.status(500).json({ error: "Internal Server Error" });
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
      return response
        .status(401)
        .json({ error: "Unauthorized: Token Invalid!" });
    }

    const user = await UserModel.findOne({ username: (decoded as decodedType)?.username });

    if (!user) {
      return response
        .status(401)
        .json({ error: "Unauthorized: User not found" });
    }
    next();
  } catch (error) {
    console.error("Unexpected error during token verification:", error);
    return response.status(500).json({ error: "Internal Server Error" });
  }
};
