import { Request, Response } from "express";
import { EnrollmentModel } from "../models/enrollment-model";
import { FinancialPlanModel } from "../models/financial-plan-model";
import { SchoolYearModel } from "../models/school-year-model";
import { getMonthsBetween } from "../utils/getMonth-in-school-year";
import { ClassModel } from "../models/class-model";
import { CourseModel } from "../models/course-model";
import { Types } from "mongoose";

export async function generateFinancialPlan(
  request: Request,
  response: Response
) {
  try {
    const { centerId, enrollmentId } = request.params;

    const schoolYear = await SchoolYearModel.findOne({
      center: centerId,
      isCurrent: true,
    });
    if (!schoolYear) {
      response
        .status(400)
        .json({ message: "Ano letivo atual não encontrado." });
      return;
    }

    const enrollment = await EnrollmentModel.findOne({
      centerId,
      _id: enrollmentId,
    });

    if (!enrollment) {
      response.status(400).json({ message: "inscrição não encontrada." });
      return;
    }

    const classMatched = await ClassModel.findById(enrollment.classId);
    if (!classMatched) {
      response.status(404).json({ message: "Classe não encontrada." });
      return;
    }

    const courseMatched = await CourseModel.findById(classMatched.course);
    if (!courseMatched) {
      response.status(404).json({ message: "Curso não encontrado." });
      return;
    }

    const months = getMonthsBetween(schoolYear.startDate, schoolYear.endDate);

    for (const [index, resultMonth] of months.entries()) {
      //coloca a data do proximo pagamento no dia 10 do proximo mes e se for decembro, coloca em janeiro do outro ano
      const dueDate =
        index === 11
          ? new Date(resultMonth.year + 1, 0, 10)
          : new Date(resultMonth.year, index + 1, 10);

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
    response.status(500).json({ message: "Erro inesperado" });
    console.log(error);
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
      status,
      schoolYear,
      centerId,
      enrollmentId,
    });
    response.status(200).json(result);
  } catch (error) {
    response.status(500).json({ message: "Erro inesperado" });
    console.log(error);
  }
}
