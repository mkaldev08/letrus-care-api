import { Schema, model, Document } from "mongoose";

export interface IReceipt extends Document {
  receiptNumber: string;
  paymentId: Schema.Types.ObjectId;
}
/* FIXME: E11000 duplicate key error collection: test.payment_receipts index: receiptNumber_1 dup key: { receiptNumber: "CAF-P2H175" }
* Como garantir que não tenha conflito de numeros de recibo iguais
*/
const ReceiptSchema = new Schema<IReceipt>(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true,
    },
    receiptNumber: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const ReceiptModel = model<IReceipt>("Payment_Receipt", ReceiptSchema);
