import { Request, Response } from "express";
import { ISchoolYear, SchoolYearModel } from "../models/school-year";

export const createSchoolYear = async (
  request: Request,
  response: Response
) => {
  const { description, startDate, endDate, isCurrent }: ISchoolYear =
    request.body;
  const { center } = request.params;
  const schoolYear: ISchoolYear = new SchoolYearModel({
    description,
    startDate,
    endDate,
    center,
    isCurrent,
  });
  try {
    await schoolYear.save();
    response.status(201).json({ _id: schoolYear._id, description });
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getSchoolYears = async (request: Request, response: Response) => {
  try {
    const { center } = request.params;

    const page = parseInt(request.query.page as string) || 1;
    const limit = Number(process.env.queryLimit) as number;
    const skip = (page - 1) * limit;
    const totalSchoolYears = await SchoolYearModel.countDocuments({ center });

    const schoolYears = await SchoolYearModel.find({ center })
      .skip(skip)
      .limit(limit)
      .sort({
        startDate: 1,
      });
    schoolYears
      ? response.status(200).json({
          schoolYears,
          totalSchoolYear: Math.ceil(totalSchoolYears / limit),
        })
      : response.status(404).json(null);
  } catch (error) {
    response
      .status(500)
      .json("Occorreu algum erro ao buscar anos lectivos paginados");
  }
};

export const getSchoolYearsNoLimited = async (
  request: Request,
  response: Response
) => {
  try {
    const { center } = request.params;

    const schoolYears = await SchoolYearModel.find({ center }).sort({
      startDate: 1,
    });
    response.status(200).json(schoolYears);
  } catch (error) {
    response.status(500).json("Occorreu algum erro ao buscar anos lectivos");
  }
};

export const getSchoolYearById = async (
  request: Request,
  response: Response
) => {
  try {
    const { id } = request.params;
    const schoolYear = await SchoolYearModel.findById(id);
    response.status(200).json(schoolYear);
  } catch (error) {
    response.status(500).json("Occorreu algum erro ao buscar ano lectivo");
  }
};

export const getCurrentSchoolYear = async (
  request: Request,
  response: Response
) => {
  try {
    const { center } = request.params;
    const schoolYear = await SchoolYearModel.findOne({
      center,
      isCurrent: true,
    });
    response.status(200).json(schoolYear);
  } catch (error) {
    response.status(500).json("Occorreu algum erro ao buscar ano lectivo");
  }
};

export const editSchoolYear = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const { description, startDate, endDate }: ISchoolYear = request.body;
    const schoolYear = SchoolYearModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          description,
          startDate,
          endDate,
        },
      },
      { $upsert: true, new: true }
    );

    response.status(200).json(schoolYear);
  } catch (error) {
    response.status(500).json("Occorreu algum erro ao editar ano lectivo");
  }
};
