import { Request, Response } from "express";
import { ClassModel } from "../models/class-model";
import { EnrollmentModel } from "../models/enrollment-model";
import { PaymentModel } from "../models/payment-model";
import { TeacherModel } from "../models/teacher-model";
import { AttendanceModel } from "../models/attendance-model";
import mongoose from "mongoose";

type StudentGrowth = { month: string; students: number }[];
type PaymentGrowthTopFive = { month: string; totalAmount: number }[];

export const getDashboard = async (request: Request, response: Response) => {
  const { centerId } = request.params;
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
      status: { $ne: "inactive" },
    });

    const totalActiveStudent = await EnrollmentModel.countDocuments({
      centerId,
      status: { $ne: "dropped" },
    });

    const totalIncompleteEnrollment = await EnrollmentModel.countDocuments({
      centerId,
      status: { $eq: "enrolled" },
    });

    const totalOverdueFee = await PaymentModel.countDocuments({
      centerId,
      // status: { $eq: "overdue" },
      dueDate: { $lt: endOfDay },
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
    const classIds = await ClassModel.find({ center: centerId }).distinct(
      "_id"
    );

    const totalDailyAbsent = classIds.length
      ? await AttendanceModel.countDocuments({
          classId: { $in: classIds },
          status: "absent",
          date: { $gte: startOfDay, $lt: endOfDay },
        })
      : 0;

    // Student growth in the last 5 months (including the current month)

    const studentGrowth: StudentGrowth = await EnrollmentModel.aggregate([
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
          students: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { month: "$_id", students: 1, _id: 0 } }, // select the month and students
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

    return response.json({
      totalActiveClassRoom,
      totalActiveStudent,
      totalDailyEnrollment,
      totalIncompleteEnrollment,
      totalOverdueFee,
      totalDailyPayment,
      totalActiveTeachers,
      totalDailyAbsent,
      studentGrowth,
      paymentGrowthTopFive,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      message: "Internal server error",
    });
  }
};
