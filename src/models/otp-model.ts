import mongoose from "mongoose";
import bcrypt from "bcrypt";

interface OTP {
  code: string;
  userId: mongoose.Types.ObjectId;
  status?: "used" | "pending";
  createdAt?: Date;
}

const OTPSchema = new mongoose.Schema<OTP>({
  code: {
    type: String,
    required: true,
  },
  userId: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now, expires: "10m" },
});

OTPSchema.pre("save", async function (next) {
  const otp = this;
  if (!otp.isModified("code")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(otp?.code, salt);
    otp.code = hashedCode;
    next();
  } catch (error: any) {
    next(error);
  }
});

export const OTPModel = mongoose.model<OTP>("OTP_Code", OTPSchema);
