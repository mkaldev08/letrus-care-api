import { Schema, model, Document } from "mongoose";

export interface ISchoolYear extends Document {
  description: string;
  startDate: Date;
  endDate: Date;
  isCurrent: Boolean;
}

const schoolYearSchema = new Schema<ISchoolYear>({
  description: { type: String, required: true, minLength: 10 },
  startDate: { type: Date, default: Date.now() },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false },
});

export const SchoolYearModel = model<ISchoolYear>(
  "SchoolYear",
  schoolYearSchema
);
