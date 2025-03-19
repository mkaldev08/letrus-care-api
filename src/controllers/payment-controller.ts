import { Request, Response } from "express";
import { PaymentModel, IPayment } from "../models/payment-model";
import { IReceipt, ReceiptModel } from "../models/payments_receipt";
import { createCode } from "../utils/generate-code";
import { StudentModel } from "../models/student-model";
import { EnrollmentModel } from "../models/enrollment-model";

export const createPayment = async (request: Request, response: Response) => {
  const {
    enrollmentId,
    amount,
    paymentDate,
    paymentMonthReference,
    paymentYearReference,
    paymentMethod,
    centerId,
    userId,
    lateFee,
  } = request.body;

  // Verificação dos campos obrigatórios
  if (!enrollmentId || !amount || !paymentMonthReference || !centerId) {
    response.status(400).json({ error: "Campos obrigatórios faltando" });
    return;
  }

  const payment: IPayment = new PaymentModel({
    enrollmentId,
    amount,
    paymentDate,
    paymentMonthReference,
    paymentYearReference,
    paymentMethod,
    centerId,
    userId,
    lateFee,
  });

  try {
    await payment.save();
    const receiptCode = await createCode(centerId, "P");
    const partCode = Date.now().toString();

    const receipt: IReceipt = new ReceiptModel({
      paymentId: payment._id,
      receiptNumber: receiptCode + partCode.slice(0, 3),
    });

    await receipt.save();
    response.status(201).json({ payment, receipt });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    response.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const getPayments = async (request: Request, response: Response) => {
  try {
    const { centerId } = request.params;
    const page = parseInt(request.query.page as string) || 1;
    const limit = Number(process.env.queryLimit) as number;
    const skip = (page - 1) * limit;
    const totalPayments = await PaymentModel.countDocuments({ centerId });

    const payments = await PaymentModel.find({ centerId })
      .skip(skip)
      .limit(limit)
      .sort({
        dueDate: -1,
      })
      .populate({
        path: "enrollmentId",
        populate: {
          path: "studentId",
        },
      });
    payments
      ? response
          .status(200)
          .json({ payments, totalPayments: Math.ceil(totalPayments / limit) })
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getPaymentsByStudent = async (
  request: Request,
  response: Response
) => {
  try {
    const { enrollmentId } = request.params;

    const payments = await PaymentModel.find({ enrollmentId });
    payments
      ? response.status(200).json(payments)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getInactivePayments = async (
  request: Request,
  response: Response
) => {
  try {
    const Payments = await PaymentModel.find({ status: "inactive" }).sort({
      name: 1,
    });
    Payments
      ? response.status(200).json(Payments)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const getPayment = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    const payment = await PaymentModel.findById(id)
      .populate({
        path: "enrollmentId",
        populate: {
          path: "studentId courseId grade",
        },
      })
      .populate("userId");
    const receipt = await ReceiptModel.findOne({ paymentId: id });
    payment
      ? response.status(200).json({ payment, receipt })
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const editPayment = async (request: Request, response: Response) => {
  const { id } = request.params;

  const { paymentMethod, amount, paymentDate, paymentMonthReference } =
    request.body;
  try {
    // Verificação dos campos obrigatórios
    if (!amount || !paymentMonthReference) {
      response.status(400).json({ error: "Campos obrigatórios faltando" });
    }
    const payment = await PaymentModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          amount,
          paymentDate,
          paymentMonthReference,
          paymentMethod,
        },
      },
      { $upsert: true, new: true }
    );
    payment
      ? response.status(200).json(payment)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};

export const updatePaymentStatus = async (
  request: Request,
  response: Response
) => {
  const { id } = request.params;
  const { status } = request.body;
  //Verifica o status enviado
  if (!["paid", "pending", "overdue"].includes(status)) {
    response.status(400).json({ error: "Status inválido" });
  }

  try {
    const payment = await PaymentModel.findByIdAndUpdate(
      { _id: id },
      { status },
      { $upsert: true, new: true }
    );

    if (!payment) {
      response.status(404).json({ error: "Pagamento não encontrado" });
    }

    response.status(200).json(payment);
  } catch (error) {
    console.error("Erro ao atualizar o status do pagamento:", error);
    response.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const searchPayments = async (request: Request, response: Response) => {
  try {
    const { centerId } = request.params;
    const { query } = request.query;

    if (!query) {
      response.status(400).json({ message: "O termo de busca é obrigatório." });
    }

    // Buscar estudantes com base no $text search
    const students = await StudentModel.find({
      centerId,
      $text: { $search: query as string },
    }).select("_id");

    if (students.length === 0) {
      response.json([]);
    }

    const studentIds = students.map((s) => s._id);

    // Buscar inscrições ligados a esses estudantes
    const enrollments = await EnrollmentModel.find({
      centerId,
      studentId: { $in: studentIds },
    }).select("_id");

    const enrollmentIds = enrollments.map((e) => e._id);

    // Buscar pagamentos ligados a esses estudantes
    const payments = await PaymentModel.find({
      centerId,
      enrollmentId: { $in: enrollmentIds },
    })
      .populate({
        path: "enrollmentId",
        populate: {
          path: "studentId",
        },
      })
      .sort({
        paymentDate: -1,
      });

    response.json(payments);
  } catch (error) {
    response.status(500).json({ message: "Erro ao buscar pagamentos", error });
  }
};
