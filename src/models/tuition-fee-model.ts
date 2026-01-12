import mongoose, { Document, Schema } from "mongoose";

export interface ITuitionFee extends Document{  
  fee: number;
  feeFine: number;
  enrollmentFee: number;
  confirmationEnrollmentFee: number;
  courseId: Schema.Types.ObjectId; 
  status: "active" | "inactive";
}

const tuitionFeeSchema = new Schema<ITuitionFee>({  
  fee: { type: Number, required: true },  
  feeFine: { type: Number, required: true },  
  enrollmentFee: { type: Number, required: true},  
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },  
  confirmationEnrollmentFee: { type: Number, required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, {
  timestamps: true,
});

export const TuitionFeeModel = mongoose.model<ITuitionFee>("TuitionFee", tuitionFeeSchema);

