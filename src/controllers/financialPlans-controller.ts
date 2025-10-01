import { Request, Response } from "express";
import { EnrollmentModel } from "../models/enrollment-model";
import { FinancialPlanModel } from "../models/financial-plan-model";
import { SchoolYearModel } from "../models/school-year-model";
import { getMonthsBetween } from "../utils/getMonth-in-school-year";
import { ClassModel } from "../models/class-model";
import { CourseModel } from "../models/course-model";
import { Types } from "mongoose";
import mongoose from "mongoose";

export async function generateFinancialPlan(
  centerId: mongoose.Schema.Types.ObjectId,
  enrollmentId: mongoose.Schema.Types.ObjectId
) {
  try {
    const schoolYear = await SchoolYearModel.findOne({
      center: centerId,
      isCurrent: true,
    });
    if (!schoolYear) {
      throw new Error("Ano letivo atual não encontrado.");
    }

    const enrollment = await EnrollmentModel.findOne({
      centerId,
      _id: enrollmentId,
    });

    if (!enrollment) {
      throw new Error("inscrição não encontrada.");
    }

    const classMatched = await ClassModel.findById(enrollment.classId);
    if (!classMatched) {
      throw new Error("Classe não encontrada.");
    }

    const courseMatched = await CourseModel.findById(classMatched.course);
    if (!courseMatched) {
      throw new Error("Curso não encontrado.");
    }

    // verifica a data de inscrição e gera os meses a partir dessa data até o final do ano letivo
    console.log("Data de inscricao ", enrollment.enrollmentDate.toDateString());

    const months = getMonthsBetween(
      enrollment.enrollmentDate < schoolYear.startDate
        ? schoolYear.startDate
        : enrollment.enrollmentDate,
      schoolYear.endDate
    );
    console.log(months); // erro no tipo e gera bug na logica, corrigir
    for (const resultMonth of months) {
      console.log("em numero: ", resultMonth.monthInNumber);
      //coloca a data do proximo pagamento no dia 10 do proximo mes e se for dezembro, coloca em janeiro do outro ano
      const dueDate =
        resultMonth.monthInNumber === 11
          ? new Date(resultMonth.year + 1, 0, 10)
          : new Date(resultMonth.year, resultMonth.monthInNumber + 1, 10);

      console.log("due date: ", dueDate);
      await FinancialPlanModel.create({
        schoolYear: schoolYear._id,
        month: resultMonth.month,
        year: resultMonth.year,
        dueDate,
        enrollmentId: enrollment._id,
        centerId: enrollment.centerId,
        userId: enrollment.userId,
        tutionFee: courseMatched.fee,
      });
    }
  } catch (error) {
    console.log(error);
    throw new Error("Erro inesperado");
  }
}

export async function getFinancialPlan(request: Request, response: Response) {
  try {
    const { status, schoolYear } = request.query;

    if (!status || !schoolYear) {
      response.status(400).json({ message: "Parâmetros insuficientes" });
      return;
    }
    const { centerId, enrollmentId } = request.params;

    const result = await FinancialPlanModel.find({
      status: status === "paid" ? "paid" : { $ne: "paid" },
      schoolYear,
      centerId,
      enrollmentId,
    }).populate("linkedPayment");
    response.status(200).json(result);
  } catch (error) {
    response.status(500).json({ message: "Erro inesperado" });
    console.log(error);
  }
}

export async function updateFinancialPlanStatus(
  status: "paid" | "pending" | "overdue",
  linkedPayment: Types.ObjectId,
  referencesConfig: {
    yearReference: number;
    monthReference: string;
    enrollmentId: Types.ObjectId;
  }
) {
  try {
    const { yearReference, monthReference, enrollmentId } = referencesConfig;

    if (yearReference === undefined || !monthReference || !enrollmentId) {
      throw new Error(
        "Parâmetros insuficientes para atualizar o plano financeiro"
      );
    }

    const result = await FinancialPlanModel.findOneAndUpdate(
      {
        year: yearReference,
        month: monthReference,
        enrollmentId,
      },
      {
        $set: { linkedPayment, status },
      },
      { $upsert: true, new: true }
    );

    return result;
  } catch (error) {
    throw new Error("Erro ao atualizar o plano financeiro: " + error);
  }
}
//TODO: implementar actualizacao automatica do estado "overdue" em todos planos quando chegar a data de vencimento cadastrada
