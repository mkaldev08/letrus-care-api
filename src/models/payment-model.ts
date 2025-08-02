import { Schema, model, Document } from "mongoose";

export interface IPayment extends Document {
  enrollmentId: Schema.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMonthReference: string;
  paymentYearReference: number;
  paymentMethod:
    | "Dinheiro"
    | "Multicaixa Express"
    | "Transferência Bancária (ATM)";
  dueDate: Date;
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
  paymentMonthReference: { type: String, required: true },
  paymentYearReference: { type: Number, required: true },
  dueDate: { type: Date },
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

// Hook para marcar a data de expiração do pagamento um mês após a data de pagamento
//FIXME: pagamento pré pago, até dia 10 do mês por frequentar
paymentSchema.pre("save", function (next) {
  const payment = this;
  try {
    if (!payment.dueDate) {
      const paymentDate = new Date(payment.paymentDate);
      payment.dueDate = new Date(
        paymentDate.setMonth(paymentDate.getMonth() + 1)
      );
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

export const PaymentModel = model<IPayment>("Payment", paymentSchema);
