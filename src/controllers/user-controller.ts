import { Request, Response } from "express";
import { UserModel, IUser } from "../models/user-model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createUser = async (request: Request, response: Response) => {
  const { username, password, role } = request.body;
  const user: IUser = new UserModel({
    username: username.toLowerCase(),
    password,
    role,
  });
  try {
    await user.save();
    response.status(201).json(user);
  } catch (error) {
    response.status(500).json(error);
  }
};

const cookieOptions: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none" | undefined | boolean;
} = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export const loginAccount = async (request: Request, response: Response) => {
  const { username, password } = request.body;
  try {
    let user: IUser | null = await UserModel.findOne({ username });

    if (!user) {
      response.status(401).json({ error: "Verifica o username" });
    } else {
      const same = await isCorrectPassword(password, user.password);
      if (!same) {
        response.status(401).json({ error: "Verifica a senha" });
      } else {
        const secret = process.env.JWT_TOKEN;
        if (!secret) {
          return;
        }
        const token = jwt.sign({ username }, secret, { expiresIn: "1h" });

        response.cookie("token", token, cookieOptions);

        response.status(200).json(user);
      }
    }
  } catch (error) {
    console.log(error);
    response
      .status(500)
      .json({ error: "Internal error, please try again", code: error });
  }
};

export const userLogout = (request: Request, response: Response) => {
  try {
    response.clearCookie("token", cookieOptions);

    response.status(204).json(null);
  } catch (error) {
    console.log(error);
    response
      .status(500)
      .json({ error: "Internal error, please try again", code: error });
  }
};

// Método assíncrono para verificar a senha correta
const isCorrectPassword = async function (
  bodyPassword: string,
  userPassword: string
): Promise<boolean> {
  try {
    const same = await bcrypt.compare(bodyPassword, userPassword);
    return same;
  } catch (err) {
    throw new Error(`Erro ao encriptar senha: ${err}`);
  }
};
