import { Schema, model, Document } from "mongoose";

export interface IStudent extends Document {
  name: { fullName: string; surname?: string };
  birthDate: Date;
  gender: "masculino" | "feminino";
  parents: { father: string; mother: string };
  address: string;
  phoneNumber: string;
  email?: string;
  centerId: Schema.Types.ObjectId;
  endStudiedDate: Date;
  studentCode: string;
  identityNumber?: string;
  status: "active" | "inactive";
}

const studentSchema = new Schema<IStudent>({
  name: {
    fullName: { type: String, required: true },
    surname: { type: String },
  },
  birthDate: { type: Date, required: true },
  gender: { type: String, enum: ["masculino", "feminino"] },
  parents: {
    father: { type: String, required: true },
    mother: { type: String, required: true },
  },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String },
  endStudiedDate: { type: Date, default: null },
  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
  studentCode: { type: String, required: true, unique: true },
  identityNumber: { type: String, required: true, unique: true, },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
});

// criação de índice de texto
studentSchema.index({
  "name.surname": "text",
  "name.fullName": "text",
  studentCode: "text",
  identityNumber: "text",
});

export const StudentModel = model<IStudent>("Student", studentSchema);
