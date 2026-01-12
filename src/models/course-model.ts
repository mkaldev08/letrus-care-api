import { Schema, model, Document } from "mongoose";

//TODO: colocar opcoes de percentagens ao escolher as taxas

export interface ICourse extends Document {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  centerId: Schema.Types.ObjectId;
  status: "active" | "inactive";
  courseType: "on_home" | "on_center";
}

const courseSchema = new Schema<ICourse>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  courseType: {
    type: String,
    enum: ["on_home", "on_center"],
    default: "on_center",
  },
});

export const CourseModel = model<ICourse>("Course", courseSchema);
