import { Request, Response } from "express";
import { ClassModel, IClass } from "../models/class-model";

export const createClass = async (request: Request, response: Response) => {
  const {
    course,
    period,
    students,
    teachers,
    className,
    center,
    classLimit,
    userId,
    schedule,
    grade,
    schoolYear
  } = request.body;

  const classInCenter: IClass = new ClassModel({
    course,
    period,
    students,
    teachers,
    className,
    center,
    classLimit,
    schedule,
    userId,
    grade,
    schoolYear
  });

  try {
    await classInCenter.save();
    response.status(201).json(classInCenter);
  } catch (error) {
    console.error("Erro ao criar turma: ", error);
    response.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const getClasses = async (request: Request, response: Response) => {
  const { centerId } = request.params;
  try {
    const classesInCenter = await ClassModel.find({
      center: centerId,
      status: "active",
    })
      .sort({
        className: 1,
      })
      .populate({ path: "grade", select: "grade" })
      .populate({ path: "course", select: "name courseType" })
      .populate({ path: "teachers", select: "fullName" })
      .populate({ path: "students", select: "name studentCode" });

    classesInCenter
      ? response.status(200).json(classesInCenter)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getClass = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    const classInCenter = await ClassModel.findById(id)
      .populate({ path: "grade", select: "grade" })
      .populate({ path: "course", select: "name courseType" })
      .populate({ path: "teachers", select: "fullName" })
      .populate({ path: "students", select: "name studentCode" });
    classInCenter
      ? response.status(200).json(classInCenter)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const editClass = async (request: Request, response: Response) => {
  const { id } = request.params;

  const { period, teachers, classLimit, schedule, className } = request.body;
  try {
    const classInCenter = await ClassModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          period,
          className,
          teachers,
          classLimit,
          schedule,
        },
      },
      { $upsert: true, new: true }
    );
    classInCenter
      ? response.status(200).json(classInCenter)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const addStudentsOnClass = async (
  request: Request,
  response: Response
) => {
  const { id } = request.params;

  const { studentId } = request.body;
  try {
    const classInCenter = await ClassModel.findById(id);
    if (!classInCenter) {
      response.status(404).json({ message: "turma não encontrada" });
      return;
    }

    if (classInCenter.students.length >= classInCenter.classLimit) {
      response.status(400).json({ message: "Limite da Turma Excedido" });
      return;
    }

    classInCenter.students.push(studentId);

    await classInCenter.save();

    response.status(200).json(classInCenter);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const updateClassStatus = async (
  request: Request,
  response: Response
) => {
  const { id } = request.params;
  const { status } = request.body;
  //Verifica o status enviado
  if (!["active", "inactive"].includes(status)) {
    response.status(400).json({ error: "Status inválido" });
    return;
  }

  try {
    const classInCenter = await ClassModel.findByIdAndUpdate(
      { _id: id },
      { status },
      { $upsert: true, new: true }
    );

    if (!classInCenter) {
      response.status(404).json({ error: "Turma não encontrada" });
      return;
    }

    response.status(200).json(classInCenter);
  } catch (error) {
    console.error("Erro ao atualizar o status da Turma:", error);
    response.status(500).json({ error: "Erro interno do servidor" });
  }
};
