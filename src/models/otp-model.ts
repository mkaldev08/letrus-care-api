import mongoose from "mongoose";

interface OTP {
  code: number;
  userId: mongoose.Types.ObjectId;
  status?: "used" | "pending";
}
const OTPSchema = new mongoose.Schema<OTP>({
  code: {
    type: Number,
    required: true,
  },
  userId: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
  status: { type: String, default: "pending" },
});

export const OTPModel = mongoose.model<OTP>("OTP_Code", OTPSchema);
