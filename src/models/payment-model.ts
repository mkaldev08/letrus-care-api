import { Schema, model, Document } from "mongoose";

export interface IPayment extends Document {
  enrollmentId: Schema.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMethod:
    | "Dinheiro"
    | "Multicaixa Express"
    | "Transferência Bancária (ATM)";
  status: "paid" | "pending" | "overdue";
  centerId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  lateFee: number;
}

const paymentSchema = new Schema<IPayment>({
  enrollmentId: {
    type: Schema.Types.ObjectId,
    ref: "Enrollment",
    required: true,
  },
  amount: { type: Number, required: true },
  lateFee: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["paid", "pending", "overdue"],
    default: "paid",
  },
  paymentMethod: {
    type: String,
    enum: ["Dinheiro", "Multicaixa Express", "Transferência Bancária (ATM)"],
    default: "Dinheiro",
  },
  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});
export const PaymentModel = model<IPayment>("Payment", paymentSchema);
