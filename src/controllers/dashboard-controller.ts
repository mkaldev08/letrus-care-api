import { Request, Response } from "express";
import { ClassModel } from "../models/class-model";
import { EnrollmentModel } from "../models/enrollment-model";
import { PaymentModel } from "../models/payment-model";
import { TeacherModel } from "../models/teacher-model";
import { AttendanceModel } from "../models/attendance-model";
import mongoose from "mongoose";
import { FinancialPlanModel } from "../models/financial-plan-model";
import { StudentModel } from "../models/student-model";

type enrollmentGrowth = { month: string; students: number }[];
type PaymentGrowthTopFive = { month: string; totalAmount: string }[];

export const getDashboard = async (request: Request, response: Response) => {
  const { centerId, schoolYearId } = request.params;

  const today = new Date();

  const normalizeDateRange = (date: Date) => {
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0
    );

    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59
    );
    return { startOfDay, endOfDay };
  };

  const getLastFiveMonthsRange = (date: Date) => {
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startDate = new Date(date.getFullYear(), date.getMonth() - 4, 1);
    return { startDate, endDate };
  };

  const { startDate, endDate } = getLastFiveMonthsRange(today);

  const { startOfDay, endOfDay } = normalizeDateRange(today);

  try {
    const totalActiveClassRoom = await ClassModel.countDocuments({
      center: centerId,
      schoolYear: schoolYearId,
      status: { $ne: "inactive" },
    });

    const totalActiveStudent = await StudentModel.countDocuments({
      centerId,
      status: { $ne: "inactive" },
    });

    const totalIncompleteEnrollment = await EnrollmentModel.countDocuments({
      centerId,
      status: { $eq: "enrolled" },
    });

    const totalOverdueFee = await FinancialPlanModel.countDocuments({
      schoolYear: schoolYearId,
      centerId,
      status: { $eq: "overdue" },
    });

    const totalActiveTeachers = await TeacherModel.countDocuments({
      centerId,
      status: { $eq: "active" },
    });

    const totalDailyEnrollment = await EnrollmentModel.countDocuments({
      centerId,
      status: { $ne: "dropped" },
      enrollmentDate: { $gte: startOfDay, $lt: endOfDay },
    });

    const totalDailyPayment = await PaymentModel.countDocuments({
      centerId,
      status: { $eq: "paid" },
      paymentDate: { $gte: startOfDay, $lt: endOfDay },
    });

    // Primeiro, buscar os IDs das classes ativas
    const classIds = await ClassModel.find({
      center: centerId,
      schoolYear: schoolYearId,
    }).distinct("_id");

    const totalDailyAbsent = classIds.length
      ? await AttendanceModel.countDocuments({
          classId: { $in: classIds },
          status: "absent",
          date: { $gte: startOfDay, $lt: endOfDay },
        })
      : 0;

    // Student growth in the last 5 months (including the current month)

    const enrollmentGrowth: enrollmentGrowth = await EnrollmentModel.aggregate([
      {
        $match: {
          centerId: new mongoose.Types.ObjectId(centerId),
          status: { $ne: "dropped" },
          enrollmentDate: { $gte: startDate, $lte: endDate }, // Filter by date range
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$enrollmentDate" } },
          enrollments: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { month: "$_id", enrollments: 1, _id: 0 } }, // select the month and enrollments
    ]);
    // Payment growth in the last 5 months (including the current month)
    const paymentGrowthTopFive: PaymentGrowthTopFive =
      await PaymentModel.aggregate([
        {
          $match: {
            centerId: new mongoose.Types.ObjectId(centerId),
            status: { $eq: "paid" },
            paymentDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$paymentDate" },
            },
            totalAmount: { $sum: "$amount" },
          },
        }, // Group by month
        { $sort: { _id: 1 } }, // Sort by month in ascending order
        { $project: { month: "$_id", totalAmount: 1, _id: 0 } },
      ]);

    // const formatCurrency = (amount: number) => {
    //   return new Intl.NumberFormat("pt", {
    //     style: "currency",
    //     currency: "AOA",
    //   }).format(amount);
    // };

    // paymentGrowthTopFive.forEach((payment) => {
    //   payment.totalAmount = formatCurrency(Number(payment.totalAmount));
    // });
    response.json({
      totalActiveClassRoom,
      totalActiveStudent,
      totalDailyEnrollment,
      totalIncompleteEnrollment,
      totalOverdueFee,
      totalDailyPayment,
      totalActiveTeachers,
      totalDailyAbsent,
      enrollmentGrowth,
      paymentGrowthTopFive,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getOverduePayments = async (
  request: Request,
  response: Response
) => {
  try {
    const { centerId, schoolYearId } = request.params;
    const page = parseInt(request.query.page as string) || 1;
    const limit =
      parseInt(request.query.limit as string) ||
      parseInt(process.env.queryLimit as string) ||
      10;
    const skip = (page - 1) * limit;

    const totalOverdueFee = await FinancialPlanModel.find({
      centerId,
      schoolYear: schoolYearId,
      status: { $eq: "overdue" },
    })
      .populate({
        path: "enrollmentId",
        select: "classId studentId",
        populate: [
          { path: "classId", select: "className" },
          { path: "studentId", select: "name studentCode" },
        ],
      })

      .skip(skip)
      .limit(limit)
      .sort({ year: -1, month: -1 });

    const total = await FinancialPlanModel.countDocuments({
      schoolYear: schoolYearId,
      centerId,
      status: { $eq: "overdue" },
    });

    response.status(200).json({
      overduePayments: totalOverdueFee,
      total: Math.floor(total / limit),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error(error);
    if (error instanceof Error) {
      response.status(500).json({ message: error.message });
    } else {
      response.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getOverduePaymentsWithoutLimitePerPage = async (
  request: Request,
  response: Response
) => {
  try {
    const { centerId, schoolYearId } = request.params;

    const totalOverdueFee = await FinancialPlanModel.find({
      centerId,
      schoolYear: schoolYearId,
      status: { $eq: "overdue" },
    })
      .populate({
        path: "enrollmentId",
        select: "classId studentId",
        populate: [
          { path: "classId", select: "className" },
          { path: "studentId", select: "name studentCode" },
        ],
      })
      .sort({ year: -1, month: -1 });

    response.status(200).json(totalOverdueFee);
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error(error);
    if (error instanceof Error) {
      response.status(500).json({ message: error.message });
    } else {
      response.status(500).json({ message: "Internal server error" });
    }
  }
};
