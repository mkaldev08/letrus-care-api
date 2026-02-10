import { Request, Response } from "express";
import { EnrollmentModel, IEnrollment } from "../models/enrollment-model";
import { createCode } from "../utils/generate-code";
import { IEnrollmentReceipt, ReceiptModel } from "../models/enrollment_receipt";
import { StudentModel } from "../models/student-model";
import { generateFinancialPlan } from "./financialPlans-controller";
import { ITuitionFee, TuitionFeeModel } from "../models/tuition-fee-model";
import mongoose from "mongoose";
import { IClass } from "../models/class-model";
import { ICourse } from "../models/course-model";

export const createEnrollment = async (
  request: Request,
  response: Response
) => {
  const {
    studentId,
    classId,
    enrollmentDate,
    status,
    hasScholarShip,
    centerId,
    userId,
  } = request.body;

  const enrollment: IEnrollment = new EnrollmentModel({
    studentId,
    classId,
    enrollmentDate,
    status,
    hasScholarShip,
    centerId,
    userId,
  });
  try {
    const receiptCode = await createCode(centerId, "E");
    const partCode = Date.now().toString();

    const receipt: IEnrollmentReceipt = new ReceiptModel({
      enrollmentId: enrollment._id,
      receiptNumber: receiptCode + partCode.slice(0, 3),
    });

    const enrollmentPrePopulated = await enrollment.populate({
      path: "classId",
      populate: [{ path: "course" }, { path: "grade", select: "grade" }],
    });

    const tuitionFee = await TuitionFeeModel.findOne({
      courseId: enrollmentPrePopulated.toObject().classId.course?._id,
      createdAt: { $lte: enrollment.enrollmentDate },
    }).sort({ createdAt: -1 });

    if (!tuitionFee) {
      response.status(409).json({
        message:
          "Taxa de matrícula histórico não encontrado para este enrollment",
      });
      return;
    }

    enrollment.tuitionFeeId = new mongoose.Types.ObjectId(
      String(tuitionFee._id)
    );
    await enrollment.save();

    const enrollmentPopulated = await enrollmentPrePopulated.populate(
      "tuitionFeeId"
    );

    await generateFinancialPlan(centerId, enrollment._id as string);

    await receipt.save();
    response.status(201).json({ receipt, enrollment: enrollmentPopulated });
  } catch (error) {
    process.env.NODE_ENV === "development" && console.log(error);
    response.status(500).json(error);
  }
};

export const getEnrollments = async (request: Request, response: Response) => {
  try {
    const page = parseInt(request.query.page as string) || 1;
    const limit = Number(process.env.queryLimit) as number;
    const skip = (page - 1) * limit;

    const { centerId } = request.params;

    const totalEnrollments = await EnrollmentModel.countDocuments({
      centerId,
      status: { $ne: "dropped" },
    });

    const enrollments = await EnrollmentModel.find({
      centerId,
      status: { $ne: "dropped" },
    })
      .skip(skip)
      .limit(limit)
      .populate("studentId")
      .populate({
        path: "classId",
        populate: [
          { path: "course", select: "name" },
          { path: "grade", select: "grade" },
        ],
      })
      .sort({
        enrollmentDate: -1,
      });
    enrollments
      ? response.status(200).json({
          enrollments,
          totalEnrollments: Math.ceil(totalEnrollments / limit),
        })
      : response.status(404).json(null);
  } catch (error) {
    process.env.NODE_ENV === "development" && console.log(error);
    response.status(500).json(error);
  }
};

export const getStudentsForAddOnClass = async (
  request: Request,
  response: Response
) => {
  try {
    const { centerId } = request.params;
    const { courseId, grade } = request.query;

    if (!courseId || !grade) {
      response.status(400).json("Precisa enviar a classe e o curso");
      return;
    }

    const enrollments = await EnrollmentModel.find({
      centerId,
      courseId,
      grade,
      status: "completed",
    })
      .select("studentId")
      .populate("studentId")
      .sort({
        enrollmentDate: -1,
      });

    if (!enrollments || enrollments.length === 0) {
      response.status(404).json(null);
    }

    response.status(200).json(enrollments);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getEnrollment = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    const enrollment = await EnrollmentModel.findById(id)
      .populate("studentId")
      .populate({
        path: "classId",
        populate: [
          { path: "course", select: "name" },
          { path: "grade", select: "grade" },
        ],
      })
      .populate("userId");

    if (!enrollment) {
      response.status(404).json(null);
      return;
    }

    if (enrollment?.tuitionFeeId) {
      await enrollment.populate({
        path: "tuitionFeeId",
        select: "fee confirmationEnrollmentFee enrollmentFee",
      });
    } else {
      const classObj = enrollment.classId as unknown as IClass;
      const courseObj = classObj.course as unknown as ICourse;

      const tuitionFee = await TuitionFeeModel.findOne({
        courseId: courseObj._id,
        createdAt: { $lte: enrollment.enrollmentDate },
      }).sort({ createdAt: -1 });

      if (!tuitionFee) {
        response.status(409).json({
          message: "TuitionFee histórico não encontrado para este enrollment",
        });
        return;
      }

      enrollment.tuitionFeeId = new mongoose.Types.ObjectId(
        String(tuitionFee?._id)
      );
      await enrollment.save();
    }

    const receipt = await ReceiptModel.findOne({ enrollmentId: id });
    response.status(200).json({ enrollment, receipt });
  } catch (error) {
    response.status(500).json(error);
  }
};

//TODO: pensar em entregar todas isncrições de um estudante ativas e deixar o front decidir qual quer exibir
export const getEnrollmentByStudentId = async (
  request: Request,
  response: Response
) => {
  const { studentId } = request.params;
  try {
    const enrollment = await EnrollmentModel.findOne({ studentId })
      .populate({
        path: "classId",
        populate: [{ path: "course" }, { path: "grade", select: "grade" }],
      })
      .sort({ enrollmentDate: -1 });

    if (!enrollment) {
      response.status(404).json(null);
      return;
    }

    if (enrollment?.tuitionFeeId) {
      await enrollment.populate({
        path: "tuitionFeeId",
        select: "fee confirmationEnrollmentFee enrollmentFee fine",
      });
    } else {
      const classObj = enrollment.classId as unknown as IClass;
      const courseObj = classObj.course as unknown as ICourse;

      const tuitionFee = await TuitionFeeModel.findOne({
        courseId: courseObj._id,
        createdAt: { $lte: enrollment.enrollmentDate },
      }).sort({ createdAt: -1 });

      if (!tuitionFee) {
        response.status(409).json({
          message: "TuitionFee histórico não encontrado para este enrollment",
        });
        return;
      }

      enrollment.tuitionFeeId = new mongoose.Types.ObjectId(
        String(tuitionFee?._id)
      );

      await enrollment.save();
    }
    response.status(200).json(enrollment);
  } catch (error) {
    process.env.NODE_ENV === "development" && console.log(error);
    response.status(500).json(error);
  }
};

export const editEnrollment = async (request: Request, response: Response) => {
  const { id } = request.params;
  const { studentId, enrollmentDate, status, classId }: IEnrollment =
    request.body;
  try {
    const enrollment = await EnrollmentModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          studentId,
          classId,
          enrollmentDate,
          status,
        },
      },
      { $upsert: true, new: true }
    );
    enrollment
      ? response.status(200).json(enrollment)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const changeStatus = async (request: Request, response: Response) => {
  const { id } = request.params;
  const { status } = request.body;
  try {
    const enrollment = await EnrollmentModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          status,
        },
      },
      { $upsert: true, new: true }
    );
    response.status(204).json(enrollment);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const searchEnrollments = async (
  request: Request,
  response: Response
) => {
  try {
    const { centerId } = request.params;
    const { query } = request.query;

    if (!query) {
      response.status(400).json({ message: "O termo de busca é obrigatório." });
      return;
    }

    // Buscar estudantes com base no $text search
    const students = await StudentModel.find({
      centerId,
      $text: { $search: query as string },
    }).select("_id");

    if (students.length === 0) {
      response.json([]);
      return;
    }

    const studentIds = students.map((s) => s._id);

    const page = parseInt(request.query.page as string) || 1;
    const limit = Number(process.env.queryLimit) as number;
    const skip = (page - 1) * limit;

    const dbQuery = {
      centerId,
      studentId: { $in: studentIds },
      status: { $ne: "dropped" },
    };

    const totalEnrollments = await EnrollmentModel.countDocuments(dbQuery);

    // Buscar inscrições ligados a esses estudantes
    const enrollments = await EnrollmentModel.find(dbQuery)
      .skip(skip)
      .limit(limit)
      .populate("studentId")
      .populate({
        path: "classId",
        populate: [
          { path: "course", select: "name" },
          { path: "grade", select: "grade" },
        ],
      })
      .sort({
        enrollmentDate: -1,
      });
    enrollments
      ? response.status(200).json({
          enrollments,
          totalEnrollments:
            Math.ceil(totalEnrollments / limit) !== 0
              ? Math.ceil(totalEnrollments / limit)
              : 1,
        })
      : response.status(404).json(null);
  } catch (error) {
    response
      .status(500)
      .json({ message: "Erro ao pesquisar por inscricoes", error });
  }
};

export const getEnrollmentFinancialContext = async (
  request: Request,
  response: Response
) => {
  const { id } = request.params;

  const enrollment = await EnrollmentModel
    .findById(id)
    .populate("tuitionFeeId");

  if (!enrollment || !enrollment.tuitionFeeId) {
    response.status(404).json(null);
    return;
  }

  const hasPreviousEnrollment = await EnrollmentModel.exists({
    studentId: enrollment.studentId,
    centerId: enrollment.centerId,
    enrollmentDate: { $lt: enrollment.enrollmentDate },
  });

  const tuitionFee = enrollment.tuitionFeeId as unknown as ITuitionFee;

  if (!hasPreviousEnrollment) {
    response.json({
      type: "enrollment",
      label: "Taxa de Inscrição",
      amount: tuitionFee.enrollmentFee,
    });
    return;
  }

  response.json({
    type: "confirmation",
    label: "Taxa de Confirmação",
    amount: tuitionFee.confirmationEnrollmentFee,
  });
};

