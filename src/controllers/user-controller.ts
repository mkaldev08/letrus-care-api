import { Request, Response } from "express";
import { UserModel, IUser } from "../models/user-model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendSMSVerification } from "./otp-controller";
import { OTPModel } from "../models/otp-model";

export const createUser = async (request: Request, response: Response) => {
  const { username, password, role, phoneNumber }: IUser = request.body;
  const user: IUser = new UserModel({
    username: username.toLowerCase(),
    password,
    role,
    phoneNumber,
  });
  try {
    await user.save();
    response.status(201).json(user);
  } catch (error) {
    response.status(500).json(error);
  }
};

type cookieOptionsType = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none" | undefined | boolean;
};

const cookieOptions: cookieOptionsType = {
  httpOnly: true,
  secure: Boolean(process.env.SECURE_ON_COOKIE as string), // true em "production"
  sameSite: (process.env.SAME_SITE as cookieOptionsType["sameSite"]),
};

export const loginAccount = async (request: Request, response: Response) => {
  const { username, password } = request.body;
  try {
    let user: IUser | null = await UserModel.findOne({ username });

    if (!user) {
      response.status(401).json({ error: "Verifica o username" });
    } else {
      const same = await isCorrectHashedData(password, user.password);
      if (!same) {
        response.status(401).json({ error: "Verifica a senha" });
      } else {
        const secret = process.env.JWT_TOKEN;
        if (!secret) {
          return;
        }
        const token = jwt.sign({ username }, secret, { expiresIn: "2h" });

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

export const findUser = async (request: Request, response: Response) => {
  try {
    const { username } = request.params;
    const user = await UserModel.findOne({ username });
    if (!user) response.status(404).json(null);
    else {
      const otpCode = await sendSMSVerification(`+244${user.phoneNumber}`);
      const OtpModel = new OTPModel({ code: otpCode, userId: user._id });
      await OtpModel.save();
      response.status(200).json({ user, message: "code has been sent." });
    }
  } catch (error) {
    console.log(error);
    response.status(500).json({ error: "Internal error, please try again" });
  }
};

export const verifyOTPCode = async (request: Request, response: Response) => {
  try {
    const { userId } = request.params;
    const { code } = request.body;

    const otpRecord = await OTPModel.findOne({
      userId,
      status: "pending",
    }).sort({
      createdAt: -1,
    });

    if (!otpRecord) {
      response
        .status(400)
        .json({ message: "Código OTP inválido ou expirado." });
      return;
    }

    if (code === undefined || code === null) {
      response.status(400).json({ message: "Código OTP não fornecido." });
      return;
    }
    const codeAsString = code.toString();
    const same = await isCorrectHashedData(codeAsString, otpRecord.code);
    if (same) {
      await OTPModel.updateOne({ _id: otpRecord._id }, { status: "used" });
      response
        .status(200)
        .json({ message: "Código OTP verificado com sucesso." });
    } else {
      response.status(400).json({ message: "Código OTP incorreto." });
    }
  } catch (error) {
    console.error("Erro ao verificar OTP:", error);
    response.status(500).json({
      error: "Erro interno do servidor. Por favor, tente novamente mais tarde.",
    });
  }
};

export const updateUser = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const { username, password, role }: IUser = request.body;
    await UserModel.findOneAndUpdate(
      { _id: id },
      { $set: { username, password, role } },
      { $upsert: true, new: true }
    );
  } catch (error) {
    console.log(error);
    response
      .status(500)
      .json({ error: "Internal error, please try again", code: error });
  }
};

const isCorrectHashedData = async function (
  requested: string,
  target: string
): Promise<boolean> {
  try {
    const same = await bcrypt.compare(requested, target);
    return same;
  } catch (err) {
    throw new Error(`Erro ao encriptar campo: ${err}`);
  }
};
