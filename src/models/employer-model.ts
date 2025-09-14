import { Schema, Model, Document, model } from "mongoose";
export interface IEmployer extends Document {
  name: string;
  surname: string;
  birthDate: Date;
  address: string;
  phoneNumber: string;
  email: string;
  hireDate: Date;
  status: "active" | "inactive";
  centerId: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  employerCode: string;
  departmentId: Schema.Types.ObjectId;
  identifyNumber: string;
  profession: string;
}

const employerSchema = new Schema({
  name: { type: String, require: true },
  surname: { type: String, require: true },
});

export const EmployerModel = model<IEmployer>("Employer", employerSchema);
