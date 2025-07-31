import { Schema, model, Document } from "mongoose";

// TODO: refactorar a logica de inscricao, tirar propriedades redudantes pois já vêem no "classId"

export interface IEnrollment extends Document {
  studentId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  enrollmentDate: Date;
  status: "enrolled" | "completed" | "dropped";
  centerId: Schema.Types.ObjectId;
  grade: Schema.Types.ObjectId;
  doc_file: string;
  image_file: string;
  userId: Schema.Types.ObjectId;
  classId: Schema.Types.ObjectId;
}

const enrollmentSchema = new Schema<IEnrollment>({
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  enrollmentDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["enrolled", "completed", "dropped"],
    default: "enrolled",
  },
  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  grade: {
    type: Schema.Types.ObjectId,
    ref: "Grade",
    required: true,
  },
  doc_file: { type: String },
  image_file: { type: String },
});

export const EnrollmentModel = model<IEnrollment>(
  "Enrollment",
  enrollmentSchema
);
