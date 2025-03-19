import { Request, Response } from "express";
import { CenterModel, ICenter } from "../models/center-model";
import { CourseModel } from "../models/course-model";
import { GradeModel } from "../models/grade-model";

export const createCenter = async (request: Request, response: Response) => {
  const defaultCourses = [
    {
      name: "Alfabetização",
      description: "Curso de alfabetização",
      startDate: new Date(),
      endDate: new Date(),
      fee: 2500,
      feeFine: 500,
    },
    {
      name: "Caligrafia",
      description: "Curso de caligrafia",
      startDate: new Date(),
      endDate: new Date(),
      fee: 3500,
      feeFine: 500,
    },
    {
      name: "Inglês",
      description: "Curso de inglês básico",
      startDate: new Date(),
      endDate: new Date(),
      fee: 2000,
      feeFine: 500,
    },
  ];

  const defaultGrades = [{ grade: "Nível 1" }, { grade: "Nível 2" }];

  const {
    name,
    address,
    nif,
    phoneNumber,
    email,
    documentCode,
    createdBy,
    year_school,
  } = request.body;
  try {
    const center: ICenter = new CenterModel({
      name,
      address,
      nif,
      phoneNumber,
      email,
      documentCode,
      createdBy,
      year_school,
    });

    const coursesWithCenter = defaultCourses.map((course) => ({
      ...course,
      centerId: center._id,
    }));
    await CourseModel.insertMany(coursesWithCenter);

    const gradesWithCenter = defaultGrades.map((grade) => ({
      ...grade,
      centerId: center._id,
    }));
    await GradeModel.insertMany(gradesWithCenter);

    await center.save();
    response.status(201).json(center);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getCenter = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    const center = await CenterModel.findById(id);
    center
      ? response.status(200).json(center)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getCenterByCreateBy = async (
  request: Request,
  response: Response
) => {
  const { createdBy } = request.params;
  try {
    const center = await CenterModel.findOne({ createdBy });
    center
      ? response.status(200).json(center)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const editCenter = async (request: Request, response: Response) => {
  const { id } = request.params;
  const { name, address, phoneNumber, email, documentCode } = request.body;

  try {
    const centerForUpdate = await CenterModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          name,
          address,
          phoneNumber,
          email,
          documentCode,
        },
      },
      { $upsert: true, new: true }
    );

    if (!centerForUpdate) {
      response.status(404).json(null);
    } else {
      response.status(200).json(centerForUpdate);
    }
  } catch (error) {
    response.status(500).json(error);
  }
};

export const addLogoInCenter = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { centerId } = request.params;
    // Verifica se o arquivo foi enviado
    if (!request.file) {
      response.status(400).json({ message: "Nenhum arquivo enviado" });
      return;
    }

    // Converte o buffer do arquivo para Base64
    const fileData = request.file.buffer.toString("base64");
    const fileType = request.file.mimetype;

    const centerForUpdate = await CenterModel.findOneAndUpdate(
      { _id: centerId },
      {
        $set: {
          fileData,
          fileType,
        },
      },
      { $upsert: true, new: true }
    );

    if (!centerForUpdate) {
      response
        .status(404)
        .json({ message: "centro não encontrado", center: null });
      return;
    }

    response.json(centerForUpdate);
  } catch (error) {
    response.status(500).json(error);
    console.log(error);
  }
};
