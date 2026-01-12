import { Schema, model, Document } from "mongoose";

export interface IEnrollment extends Document {
  studentId: Schema.Types.ObjectId;
  enrollmentDate: Date;
  status: "enrolled" | "completed" | "dropped";
  doc_file: string;
  image_file: string;
  userId: Schema.Types.ObjectId;
  classId: Schema.Types.ObjectId;
  centerId:Schema.Types.ObjectId;
  hasScholarShip: boolean;
  hasFinancialPlan: boolean
  tuitionFeeId: Schema.Types.ObjectId;
}

const enrollmentSchema = new Schema<IEnrollment>({
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  enrollmentDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["enrolled", "completed", "dropped"],
    default: "enrolled",
  },
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
  doc_file: { type: String },
  image_file: { type: String },
  hasScholarShip: { type: Boolean, default: false },
  hasFinancialPlan: { type: Boolean, default: false },
   tuitionFeeId: {
  type: Schema.Types.ObjectId,
  ref: "TuitionFee",
  required: true
}

});

export const EnrollmentModel = model<IEnrollment>(
  "Enrollment",
  enrollmentSchema
);
