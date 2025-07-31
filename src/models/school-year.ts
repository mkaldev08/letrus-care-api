import { Schema, model, Document } from "mongoose";

export interface ISchoolYear extends Document {
  description: string;
  startDate: Date;
  endDate: Date;
  isCurrent: Boolean;
  center: Schema.Types.ObjectId;
}

//TODO: Fazer com que só seja possivel deixar um ano unico letivo como atual
//TODO: Implementar validação para que o ano letivo atual não possa ser deletado
// TODO: Implementar validacao p nao criar mais que um ano lectivo no mesmo periodo de tempo
//FIXME: tentar colocar verificação de mesma descrição no unico centro "nao pode existir dos anos com mesmo nome no mesmo centro"

const schoolYearSchema = new Schema<ISchoolYear>({
  description: { type: String, required: true, maxLength: 10 },
  startDate: { type: Date, default: Date.now() },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false },
  center: { type: Schema.Types.ObjectId, ref: "Center", required: true }
});

export const SchoolYearModel = model<ISchoolYear>(
  "SchoolYear",
  schoolYearSchema
);
