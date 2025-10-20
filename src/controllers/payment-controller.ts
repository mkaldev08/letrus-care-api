import { Request, Response } from "express";
import { PaymentModel, IPayment } from "../models/payment-model";
import { IReceipt, ReceiptModel } from "../models/payments_receipt";
import { createCode } from "../utils/generate-code";
import { StudentModel } from "../models/student-model";
import { EnrollmentModel } from "../models/enrollment-model";
import { updateFinancialPlanStatus } from "./financialPlans-controller";
import { FinancialPlanModel } from "../models/financial-plan-model";

export const createPayment = async (request: Request, response: Response) => {
  const {
    enrollmentId,
    amount,
    paymentDate,
    paymentMethod,
    centerId,
    userId,
    lateFee,
    paymentMonthReference,
    schoolYearId,
  } = request.body;

  // Verificação dos campos obrigatórios
  if (!enrollmentId || !amount || !centerId) {
    response.status(400).json({ error: "Campos obrigatórios faltando" });
    return;
  }

  const payment: IPayment = new PaymentModel({
    enrollmentId,
    amount,
    paymentDate,
    paymentMethod,
    centerId,
    userId,
    lateFee,
  });

  try {
    const receiptCode = await createCode(centerId, "P");
    const partCode = Date.now().toString();

    const receipt: IReceipt = new ReceiptModel({
      paymentId: payment._id,
      receiptNumber: receiptCode + partCode.slice(0, 3),
    });

    //actualiza o plano financeiro depois de pagar e ter o recibo
    await updateFinancialPlanStatus("paid", payment._id as string, {
      monthReference: paymentMonthReference,
      enrollmentId: String(enrollmentId),
      schoolYearId,
    });

    await payment.save();
    await receipt.save();

    response.status(201).json({ payment, receipt });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    response.status(500).json({ error: "Erro interno do servidor " });
  }
};

export const getPayments = async (request: Request, response: Response) => {
  try {
    const { centerId } = request.params;
    const page = parseInt(request.query.page as string) || 1;
    const limit = Number(process.env.queryLimit) as number;
    const skip = (page - 1) * limit;

    const totalPayments = await PaymentModel.countDocuments({ centerId });

    // 1. Busca os pagamentos
    const payments = await PaymentModel.find({ centerId })
      .skip(skip)
      .limit(limit)
      .sort({
        paymentDate: -1,
      })
      .populate({
        path: "enrollmentId",
        select: "studentId",
        populate: {
          path: "studentId",
          select: "name studentCode",
        },
      })
      .lean();

    if (!payments || payments.length === 0) {
      response.status(200).json({ payments: [], totalPayments: 0 });
      return;
    }

    const paymentIds = payments.map((p) => p._id);

    const financialPlans = await FinancialPlanModel.find({
      linkedPayment: { $in: paymentIds },
      centerId,
      status: "paid",
    }).select("month year linkedPayment");

    const financialPlanMap = new Map(); //TODO: Estudar melhor os Maps em JS
    financialPlans.forEach((fp) => {
      const linkedPaymentId = String(fp.linkedPayment);

      if (linkedPaymentId) {
        financialPlanMap.set(linkedPaymentId, {
          month: fp.month,
          year: fp.year,
        });
      }
    });

    const paymentsWithReference = payments.map((payment) => {
      const reference = financialPlanMap.get(String(payment._id));
      return {
        ...payment,
        paymentMonthReference: reference ? reference.month : "N/D",
        paymentYearReference: reference ? reference.year : "N/D",
      };
    });

    response.status(200).json({
      payments: paymentsWithReference,
      totalPayments: Math.ceil(totalPayments / limit),
    });
  } catch (error) {
    console.error(error);
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
    const paymentForShow = await PaymentModel.findById(id)
      .populate({
        path: "enrollmentId",
        populate: {
          path: "studentId",
        },
      })
      .populate({
        path: "enrollmentId",
        populate: {
          path: "classId",
          populate: [{ path: "course" }, { path: "grade", select: "grade" }],
        },
      })
      .populate("userId");

    if (!paymentForShow) {
      response.status(404).json(null);
      return;
    }
    const financialPlanReference = await FinancialPlanModel.findOne({ linkedPayment: paymentForShow?._id }).select("month year");

    const receipt = await ReceiptModel.findOne({ paymentId: id });

    response.status(200).json({
      payment: {
        ...paymentForShow.toObject(),
        paymentMonthReference: financialPlanReference ? financialPlanReference.month : "N/D",
        paymentYearReference: financialPlanReference ? financialPlanReference.year : "N/D"
      }, receipt
    });
  } catch (error) {
    response.status(500).json(error);
  }
};

export const editPayment = async (request: Request, response: Response) => {
  const { id } = request.params;

  const { paymentMethod, amount, paymentDate } = request.body;
  try {
    // Verificação dos campos obrigatórios
    if (!amount || !paymentDate || !paymentMethod) {
      response.status(400).json({ error: "Campos obrigatórios faltando" });
    }
    const payment = await PaymentModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          amount,
          paymentDate,
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

    // Buscar inscrições ligados a esses estudantes
    const enrollments = await EnrollmentModel.find({
      centerId,
      studentId: { $in: studentIds },
    }).select("_id");

    const enrollmentIds = enrollments.map((e) => e._id);

    // Buscar pagamentos ligados a esses estudantes
    const page = parseInt(request.query.page as string) || 1;
    const limit = Number(process.env.queryLimit) as number;
    const skip = (page - 1) * limit;
    const totalPayments = await PaymentModel.countDocuments({
      centerId,
      enrollmentId: { $in: enrollmentIds },
    });

    const payments = await PaymentModel.find({
      centerId,
      enrollmentId: { $in: enrollmentIds },
    })
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
      ? response.status(200).json({
        payments,
        totalPayments:
          Math.ceil(totalPayments / limit) !== 0
            ? Math.ceil(totalPayments / limit)
            : 1,
      })
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json({ message: "Erro ao buscar pagamentos", error });
  }
};
