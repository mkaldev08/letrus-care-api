import mongoose,{  model, Document, Schema } from "mongoose";

export interface IEnrollment extends Document {
  enrollment: import("mongoose").Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  enrollmentDate: Date;
  status: "enrolled" | "completed" | "dropped";
  doc_file: string;
  image_file: string;
  userId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  centerId:mongoose.Types.ObjectId;
  hasScholarShip: boolean;
  hasFinancialPlan: boolean
  tuitionFeeId: mongoose.Types.ObjectId;
}

const enrollmentSchema = new Schema<IEnrollment>({
  studentId: { type: Schema.ObjectId, ref: "Student", required: true },
  enrollmentDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["enrolled", "completed", "dropped"],
    default: "enrolled",
  },
  classId: { type: Schema.ObjectId, ref: "Class", required: true },
  userId: { type: Schema.ObjectId, ref: "User", required: true },
  centerId: { type: Schema.ObjectId, ref: "Center", required: true },
  doc_file: { type: String },
  image_file: { type: String },
  hasScholarShip: { type: Boolean, default: false },
  hasFinancialPlan: { type: Boolean, default: false },
   tuitionFeeId: {
  type: Schema.ObjectId,
  ref: "TuitionFee",
  required: true
}

});

export const EnrollmentModel = model<IEnrollment>(
  "Enrollment",
  enrollmentSchema
);
