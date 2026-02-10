import { Request, Response, NextFunction } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { UserModel } from "../models/user-model";
const secret = process.env.JWT_TOKEN;

export const withAuth = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  const token = request.cookies?.token;
  if (!token) {
    response.status(401).json({
      code: "AUTH_TOKEN_NOT_PROVIDED",
      message: "Unauthorized: no token provided",
    });
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
      response.status(401).json({
        code: "AUTH_TOKEN_INVALID",
        message: "Unauthorized: Token Invalid!",
      });
      return;
    }

    const user = await UserModel.findOne({
      username: (decoded as decodedType)?.username,
    });

    if (!user) {
      response.status(401).json({code:"USER_NOT_FOUND", message: "Unauthorized: User not found" });
      return;
    }
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      response.status(401).json({
        code: "AUTH_TOKEN_EXPIRED",
        message: "Sessão expirada",
      });
      return;
    }

    response.status(401).json({
      code: "AUTH_INVALID_TOKEN",
      message: "Token inválido",
    });
  }
};
