import { Schema, model, Document } from "mongoose";

//TODO: colocar opcoes de percentagens ao escolher as taxas

export interface ICourse extends Document {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  fee: number;
  feeFine: number;
  enrollmentFee: number;
  centerId: Schema.Types.ObjectId;
  status: "active" | "inactive";
  courseType: "on_home" | "on_center";
}

const courseSchema = new Schema<ICourse>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  fee: { type: Number, required: true },
  feeFine: { type: Number, required: true },
  enrollmentFee: { type: Number, default: 0 },
  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  courseType: {
    type: String,
    enum: ["on_home", "on_center"],
    default: "on_center",
  },
});

export const CourseModel = model<ICourse>("Course", courseSchema);
