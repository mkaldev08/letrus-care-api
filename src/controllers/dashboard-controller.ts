import { Request, Response } from "express";
import { ClassModel } from "../models/class-model";
import { EnrollmentModel } from "../models/enrollment-model";
import { PaymentModel } from "../models/payment-model";
import { TeacherModel } from "../models/teacher-model";
import { AttendanceModel } from "../models/attendance-model";

type StudentGrowth = { month: string; students: number }[];
type PaymentGrowthTopFive = { month: string; amount: number }[];

export const getDashboard = async (request: Request, response: Response) => {
  const { centerId } = request.params;
  const today = new Date();
  try {
    const totalActiveClassRoom = await ClassModel.countDocuments({
      center: centerId,
      status: { $ne: "inactive" },
    });

    const totalActiveStudent = await EnrollmentModel.countDocuments({
      centerId,
      status: { $ne: "dropped" },
    });

    const totalDailyEnrollment = await EnrollmentModel.countDocuments({
      centerId,
      status: { $ne: "dropped" },
      enrollmentDate: { $eq: today },
    });

    const totalIncompleteEnrollment = await EnrollmentModel.countDocuments({
      centerId,
      status: { $eq: "enrolled" },
    });

    const totalDailyPayment = await PaymentModel.countDocuments({
      centerId,
      status: { $eq: "paid" },
      paymentDate: { $eq: today },
    });

    const totalOverdueFee = await PaymentModel.countDocuments({
      centerId,
      status: { $eq: "overdue" },
    });

    const totalActiveTeachers = await TeacherModel.countDocuments({
      centerId,
      status: { $eq: "active" },
    });

    const totalDailyAbsent = await AttendanceModel.countDocuments({
      centerId,
      classId: {
        $in: await ClassModel.find({ center: centerId }).distinct("_id"),
      },
      status: { $eq: "absent" },
      date: { $eq: today },
    });

    const startDate = new Date(today.getFullYear(), today.getMonth() - 4, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Student growth in the last 5 months (including the current month)
    const studentGrowth: StudentGrowth = await EnrollmentModel.aggregate([
      {
        $match: {
          centerId,
          status: { $ne: "dropped" },
          enrollmentDate: { $gte: startDate, $lte: endDate }, // Filter by date range
        },
      },
      { $group: { _id: { $month: "$enrollmentDate" }, students: { $sum: 1 } } }, // Group by month
      { $sort: { _id: 1 } }, // Sort by month in ascending order
      { $project: { month: "$_id", students: 1, _id: 0 } }, // Project the month and students
    ]);

    // Payment growth in the last 5 months (including the current month)
    const paymentGrowthTopFive: PaymentGrowthTopFive =
      await PaymentModel.aggregate([
        {
          $match: {
            centerId,
            status: { $eq: "paid" },
            paymentDate: { $gte: startDate, $lte: endDate },
          },
        }, // Filter paid payments
        // Group by month
        { $sort: { _id: 1 } }, // Sort by month in ascending order
        { $limit: 5 }, // Get the top 5 months
        { $project: { month: "$_id", amount: 1, _id: 0 } },
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
