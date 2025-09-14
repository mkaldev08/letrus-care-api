import { Schema, model, Document } from "mongoose";

export interface IRole extends Document {
  roleName: string;
  createdAt: Date;
  centerId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  salary: number;
  departmentId: Schema.Types.ObjectId;
}

const roleSchema = new Schema<IRole>({
  roleName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  centerId: {
    type: Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  salary: { type: Number, required: true },
  departmentId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Department",
  },
});

export const RoleModel = model<IRole>("Role", roleSchema);
