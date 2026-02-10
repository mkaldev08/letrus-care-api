import { Request, Response } from "express";
import { CourseModel } from "../models/course-model";
import { TuitionFeeModel } from "../models/tuition-fee-model";

export const createCourse = async (request: Request, response: Response) => {
  const {
    name,
    description,
    startDate,
    endDate,
    centerId,
    status,
    courseType,
    fee,
    feeFine,
    enrollmentFee,
    confirmationEnrollmentFee,
  } = request.body;

  try {
    const course = new CourseModel({
      name,
      description,
      startDate,
      endDate,
      centerId,
      status,
      courseType,
    });

    await course.save();

    const tuitionFee = new TuitionFeeModel({
      courseId: course._id,
      fee,
      feeFine,
      enrollmentFee,
      confirmationEnrollmentFee,
      status: "active",
    });

    await tuitionFee.save();

    const feeData = await TuitionFeeModel.findOne({
      courseId: course._id,
      status: "active",
    }).select("-_id -__v");

    response.status(201).json({
      ...course.toObject(),
      ...(feeData?.toObject() ?? {}),
    });
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getCourses = async (request: Request, response: Response) => {
  try {
    const { centerId } = request.params;

    const page = Number(request.query.page) || 1;
    const limit = Number(process.env.queryLimit) || 10;
    const skip = (page - 1) * limit;

    const [courses, totalCourses] = await Promise.all([
      CourseModel.find({ status: "active", centerId })
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 }),
      CourseModel.countDocuments({ status: "active", centerId }),
    ]);

    const tuitionFees = await TuitionFeeModel.find({
      courseId: { $in: courses.map((c) => c._id) },
      status: "active",
    }).select("-_id -__v");

    const feeMap = new Map(
      tuitionFees.map((tf) => [String(tf.courseId), tf.toObject()])
    );

    response.status(200).json({
      courses: courses.map((course) => ({
        ...course.toObject(),
        ...(feeMap.get(String(course._id)) ?? {}),
      })),
      totalCourses: Math.ceil(totalCourses / limit),
    });
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getCoursesWithoutLimit = async (
  request: Request,
  response: Response
) => {
  try {
    const { centerId } = request.params;

    const courses = await CourseModel.find({
      status: "active",
      centerId,
    }).sort({ name: 1 });

    const tuitionFees = await TuitionFeeModel.find({
      courseId: { $in: courses.map((c) => c._id) },
      status: "active",
    }).select("-_id -__v");

    const feeMap = new Map(
      tuitionFees.map((tf) => [String(tf.courseId), tf.toObject()])
    );

    response.status(200).json(
      courses.map((course) => ({
        ...course.toObject(),
        ...(feeMap.get(String(course._id)) ?? {}),
      }))
    );
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getCourse = async (request: Request, response: Response) => {
  const { id } = request.params;

  try {
    const course = await CourseModel.findById(id);
    if (!course) {
      response.status(404).json(null);
      return;
    }

    const tuitionFee = await TuitionFeeModel.findOne({
      courseId: id,
      status: "active",
    }).select("-_id -__v");

    if (!tuitionFee) {
      response.status(400).json({
        message: "Tuition fee not found for this course.",
      });
      return;
    }

    response.status(200).json({
      ...course.toObject(),
      ...tuitionFee.toObject(),
    });
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getInactiveCourses = async (
  request: Request,
  response: Response
) => {
  try {
    const courses = await CourseModel.find({ status: "inactive" })
      .sort({ name: 1 });

    if (!courses.length) {
      response.status(404).json(null);
      return;
    }

    const tuitionFees = await TuitionFeeModel.find({
      courseId: { $in: courses.map((course) => course._id) },
      status: "inactive",
    });

    const feeMap = new Map(
      tuitionFees.map((fee) => [String(fee.courseId), fee.toObject()])
    );

    response.status(200).json(
      courses.map((course) => ({
        ...course.toObject(),
        ...(feeMap.get(String(course._id)) ?? {}),
      }))
    );
  } catch (error) {
    response.status(500).json(error);
  }
};

export const editCourse = async (request: Request, response: Response) => {
  const { id } = request.params;
  const {
    name,
    description,
    startDate,
    endDate,
    courseType,
    fee,
    feeFine,
    enrollmentFee,
    confirmationEnrollmentFee,
  } = request.body;

  try {
    const course = await CourseModel.findByIdAndUpdate(
      id,
      {
        name,
        description,
        startDate,
        endDate,
        courseType,
      },
      { new: true }
    );

    if (!course) {
      response.status(404).json(null);
      return;
    }

    await TuitionFeeModel.updateOne(
      { courseId: id, status: "active" },
      { $set: { status: "inactive" } }
    );

    const tuitionFee = new TuitionFeeModel({
      courseId: id,
      fee,
      feeFine,
      enrollmentFee,
      confirmationEnrollmentFee,
      status: "active",
    });

    await tuitionFee.save();

    const feeData = await TuitionFeeModel.findOne({
      courseId: id,
      status: "active",
    }).select("-_id -__v");

    response.status(200).json({
      ...course.toObject(),
      ...(feeData?.toObject() ?? {}),
    });
  } catch (error) {
    response.status(500).json(error);
  }
};

export const deleteCourse = async (request: Request, response: Response) => {
  const { id } = request.params;

  try {
    await CourseModel.findByIdAndUpdate(id, {
      status: "inactive",
      endDate: new Date(),
    });

    await TuitionFeeModel.updateMany(
      { courseId: id, status: "active" },
      { $set: { status: "inactive" } }
    );

    response.status(204).send();
  } catch (error) {
    response.status(500).json(error);
  }
};
