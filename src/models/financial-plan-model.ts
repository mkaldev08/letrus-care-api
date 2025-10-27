import { Schema, model, Document } from "mongoose";

export interface IFinancialPlan extends Document {
  schoolYear: Schema.Types.ObjectId;
  month: string;
  year: number;
  enrollmentId: Schema.Types.ObjectId;
  centerId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  status: "paid" | "pending" | "overdue";
  dueDate: Date;
  tutionFee: number;
  linkedPayment?: Schema.Types.ObjectId;
}

const financialPlanSchema = new Schema<IFinancialPlan>({
  schoolYear: {
    type: Schema.Types.ObjectId,
    ref: "SchoolYear",
    required: true,
  },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  enrollmentId: {
    type: Schema.Types.ObjectId,
    ref: "Enrollment",
    required: true,
  },
  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["paid", "pending", "overdue"],
    default: "pending",
  },
  dueDate: { type: Date, required: true },
  tutionFee: { type: Number, required: true },
  linkedPayment: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
});

export const FinancialPlanModel = model<IFinancialPlan>(
  "FinancialPlan",
  financialPlanSchema
);
