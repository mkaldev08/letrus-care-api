import { Schema, model, Document } from "mongoose";

export interface IDepartment extends Document {
  departmentName: string;
  createdAt: Date;
  centerId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
}

const departmentSchema = new Schema<IDepartment>({
  departmentName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  centerId: {
    type: Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export const DepartmentModel = model<IDepartment>(
  "Department",
  departmentSchema
);
