import { Schema, model, Document } from "mongoose";

export interface ICenter extends Document {
  name: string;
  address: string;
  nif: string;
  phoneNumber: string;
  email: string;
  createdAt: Date;
  documentCode: string;
  createdBy: Schema.Types.ObjectId;
  fileType?: String;
  fileData?: String;
}

const centerSchema = new Schema<ICenter>({
  name: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  nif: { type: String, required: true, minLength: 10, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  createdAt: { type: Date, default: Date.now },
  documentCode: { type: String, required: true, unique: true, maxlength: 5 },
  fileType: String,
  fileData: String,
});

export const CenterModel = model<ICenter>("Center", centerSchema);
