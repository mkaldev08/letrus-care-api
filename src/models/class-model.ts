import { Schema, model, Document } from "mongoose";

export interface IClass extends Document {
  course: Schema.Types.ObjectId;
  period: "morning" | "moon" | "evening";
  grade: Schema.Types.ObjectId;
  students: Schema.Types.ObjectId[]; //pretendo remover atraves da redundancia,pois ja tenho classId em enrollment que tem studentId
  teachers: Schema.Types.ObjectId[];
  className: string;
  center: Schema.Types.ObjectId;
  classLimit: number;
  status: "active" | "inactive";
  userId: Schema.Types.ObjectId;
  schedule: string;
  schoolYear: Schema.Types.ObjectId;
}

const classSchema = new Schema<IClass>({
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  period: {
    type: String,
    enum: ["morning", "moon", "evening"],
    required: true,
  },
  students: [{ type: Schema.Types.ObjectId, ref: "Student" }],
  teachers: [{ type: Schema.Types.ObjectId, ref: "Teacher", required: true }],
  grade: { type: Schema.Types.ObjectId, ref: "Grade", required: true },
  className: { type: String, required: true, unique: true },
  center: { type: Schema.Types.ObjectId, ref: "Center", required: true },
  classLimit: { type: Number, default: 20 },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  schedule: { type: String, required: true },
  schoolYear: { type: Schema.Types.ObjectId, ref: "SchoolYear", required: true },
});

classSchema.index({
  className: "text",
});

export const ClassModel = model<IClass>("Class", classSchema);
