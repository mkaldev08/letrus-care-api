import { Request, Response } from "express";
import { StudentModel, IStudent } from "../models/student-model";
import { createCode } from "../utils/generate-code";

export const createStudent = async (request: Request, response: Response) => {
  const {
    name,
    birthDate,
    parents,
    address,
    phoneNumber,
    email,
    centerId,
    gender,
  }: IStudent = request.body;
  const studentCode = await createCode(centerId, "S");
  const student: IStudent = new StudentModel({
    name,
    birthDate,
    parents,
    address,
    phoneNumber,
    email,
    centerId,
    gender,
    studentCode,
  });
  try {
    await student.save();
    response.status(201).json(student);
  } catch (error) {
    console.log(error);
    response.status(500).json(error);
  }
};

export const getStudents = async (request: Request, response: Response) => {
  try {
    const students = await StudentModel.find().sort({
      "name.fullName": 1,
    });
    students
      ? response.status(200).json(students)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getStudent = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    const student = await StudentModel.findById(id);
    student
      ? response.status(200).json(student)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const searchStudent = async (request: Request, response: Response) => {
  const { query } = request.query;
  const { centerId } = request.params;

  try {
    // Garantir que o valor de query seja uma string
    if (typeof query !== "string") {
      response
        .status(400)
        .json({ message: "Query string precisa ser string." });
      return;
    }

    const results = await StudentModel.find({
      centerId,
      $text: { $search: query },
    });

    if (results) {
      response.status(200).json(results);
    } else {
      response.status(404).json({ message: "nenhum Estudante encontrado." });
    }
  } catch (error) {
    // Tratar qualquer erro que ocorrer durante a busca
    response.status(500).json({ message: "Server error", error });
  }
};

export const editStudent = async (request: Request, response: Response) => {
  const { id } = request.params;
  const {
    name,
    birthDate,
    parents,
    address,
    phoneNumber,
    email,
    centerId,
    gender,
  }: IStudent = request.body;
  try {
    const student = await StudentModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          name,
          birthDate,
          parents,
          address,
          phoneNumber,
          email,
          centerId,
          gender,
        },
      },
      { $upsert: true, new: true }
    );
    student
      ? response.status(200).json(student)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const deleteStudent = async (request: Request, response: Response) => {
  const { id } = request.params;
  const endStudiedDate = Date.now();
  try {
    await StudentModel.findOneAndUpdate(
      { _id: id },
      { $set: { status: "inactive", endStudiedDate } },
      { $upsert: true, new: true }
    );
    response.status(204).json({ message: "success" });
  } catch (error) {
    response.status(500).json(error);
  }
};
