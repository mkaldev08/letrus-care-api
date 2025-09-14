import { Request, Response } from "express";
import { EnrollmentModel, IEnrollment } from "../models/enrollment-model";
import { createCode } from "../utils/generate-code";
import { IEnrollmentReceipt, ReceiptModel } from "../models/enrollment_receipt";
import { StudentModel } from "../models/student-model";

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
  }: IEnrollment = request.body;

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
    await enrollment.save();
    const receiptCode = await createCode(centerId, "E");
    const partCode = Date.now().toString();

    const receipt: IEnrollmentReceipt = new ReceiptModel({
      enrollmentId: enrollment._id,
      receiptNumber: receiptCode + partCode.slice(0, 3),
    });

    await receipt.save();
    response.status(201).json({ enrollment, receipt });
  } catch (error) {
    console.log(error);
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
    enrollments.length !== 0
      ? response.status(200).json(enrollments)
      : response.status(404).json(null);
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
          { path: "course", select: "name enrollmentFee" },
          { path: "grade", select: "grade" },
        ],
      })
      .populate("userId");
    enrollment;
    const receipt = await ReceiptModel.findOne({ enrollmentId: id });
    enrollment
      ? response.status(200).json({ enrollment, receipt })
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};
export const getEnrollmentByStudentId = async (
  request: Request,
  response: Response
) => {
  const { studentId } = request.params;
  try {
    const enrollment = await EnrollmentModel.findOne({ studentId }).populate({
      path: "classId",
      populate: [{ path: "course" }, { path: "grade", select: "grade" }],
    });
    enrollment
      ? response.status(200).json(enrollment)
      : response.status(404).json(null);
  } catch (error) {
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
