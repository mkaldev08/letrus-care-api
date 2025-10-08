const mongoose = require("mongoose");
require("dotenv").config();

// Mapeamento dos nomes dos meses para o número do mês (0 para Janeiro, 11 para Dezembro)
const monthNameToNumber = {
  Janeiro: 0,
  Fevereiro: 1,
  Março: 2,
  Abril: 3,
  Maio: 4,
  Junho: 5,
  Julho: 6,
  Agosto: 7,
  Setembro: 8,
  Outubro: 9,
  Novembro: 10,
  Dezembro: 11,
};

async function migratePaymentsToFinancialPlan() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.error("Indique uma url no .env (MONGO_URL)");
    return;
  }

  await mongoose.connect(uri);

  const PaymentCollection = mongoose.connection.collection("payments");
  const FinancialPlanCollection =
    mongoose.connection.collection("financialplans");
  const EnrollmentCollection = mongoose.connection.collection("enrollments");
  const SchoolYearCollection = mongoose.connection.collection("schoolyears");
  const ClassesCollection = mongoose.connection.collection("classes");
  const CoursesCollection = mongoose.connection.collection("courses");

  console.log(
    "\nIniciando a migração de pagamentos antigos para FinancialPlan..."
  );

  let successCount = 0;
  let notFoundCount = 0;
  let createdCount = 0; // Novo contador

  try {
    // 1. Buscar todos os pagamentos existentes
    const oldPayments = await PaymentCollection.find({
      status: "paid",
      paymentMonthReference: { $exists: true },
    }).toArray();

    if (oldPayments.length === 0) {
      console.log("Nenhum pagamento antigo encontrado para vinculação.");
      return;
    }

    for (const payment of oldPayments) {
      const {
        enrollmentId,
        _id: paymentId,
        centerId,
        userId,
        paymentMonthReference,
        paymentYearReference,
        amount, // Opcional, para logs se o valor for diferente da tutionFee
      } = payment;

      if (!paymentMonthReference || paymentYearReference === undefined) {
        console.warn(
          `[Pular] Pagamento ${paymentId} não tem referência de mês/ano.`
        );
        continue;
      }

      // 2. Tentar encontrar e Atualizar o FinancialPlan correspondente
      const updateResult = await FinancialPlanCollection.updateOne(
        {
          enrollmentId: enrollmentId,
          month: paymentMonthReference,
          year: paymentYearReference,
          linkedPayment: { $exists: false }, // Garante que não foi vinculado ainda
        },
        {
          $set: {
            status: "paid",
            linkedPayment: paymentId,
          },
        }
      );

      if (updateResult.modifiedCount > 0) {
        successCount++;
      } else {
        // O plano não foi encontrado (ou já estava vinculado)
        const foundPlan = await FinancialPlanCollection.findOne({
          enrollmentId: enrollmentId,
          month: paymentMonthReference,
          year: paymentYearReference,
        });

        if (!foundPlan) {
          // ===================================
          // TODO: Criar FinancialPlan se não existir
          // ===================================
          console.warn(
            `[Criando] FinancialPlan ausente para: Enrolment ${enrollmentId}, Mês: ${paymentMonthReference}, Ano: ${paymentYearReference}`
          );

          // Buscar dados necessários para criar o plano
          const enrollment = await EnrollmentCollection.findOne({
            _id: enrollmentId,
          });
          const schoolYear = await SchoolYearCollection.findOne({
            center: centerId,
            isCurrent: true,
          }); // Assumindo ano atual é o mais provável

          if (!enrollment || !schoolYear) {
            console.error(
              `[FALHA DE CRIAÇÃO] Dados insuficientes para criar plano para ${enrollmentId}.`
            );
            notFoundCount++;
            continue;
          }

          const classDoc = await ClassesCollection.findOne({
            _id: enrollment.classId,
          });
          const courseDoc = await CoursesCollection.findOne({
            _id: classDoc?.course,
          });

          const tutionFee = courseDoc.fee;

          // Calcula a data de vencimento (10º dia do MÊS SEGUINTE ao de referência)
          const monthNumber = monthNameToNumber[paymentMonthReference];
          if (monthNumber === undefined) {
            console.error(
              `[FALHA DE CRIAÇÃO] Nome de mês inválido: ${paymentMonthReference}`
            );
            notFoundCount++;
            continue;
          }

          const dueDate =
            monthNumber === 11
              ? new Date(paymentYearReference + 1, 0, 10) // Janeiro do próximo ano
              : new Date(paymentYearReference, monthNumber + 1, 10); // Próximo mês

          // Inserir o novo FinancialPlan (já como pago e vinculado)
          await FinancialPlanCollection.insertOne({
            schoolYear: schoolYear._id,
            month: paymentMonthReference,
            year: paymentYearReference,
            dueDate,
            enrollmentId: enrollment._id,
            centerId: centerId,
            userId: userId,
            tutionFee: tutionFee,
            status: "paid",
            linkedPayment: paymentId,
          });

          createdCount++;
          successCount++;
          // ===================================
        } else if (foundPlan.linkedPayment) {
          // Se encontrou, mas já estava vinculado
          console.log(
            `[Pular] FinancialPlan já vinculado para: Enrolment ${enrollmentId}, Mês: ${paymentMonthReference}, Ano: ${paymentYearReference}`
          );
          successCount++;
          continue;
        } else {
          // Caso não tenha sido modificado e o linkedPayment seja null, é um erro inesperado
          console.error(
            `[ERRO] FinancialPlan ${foundPlan._id} não atualizado e não está vinculado!`
          );
          notFoundCount++;
        }
      }
    }

    console.log("-----------------------------------------");
    console.log(`Vinculação de Pagamentos Concluída:`);
    console.log(`- Pagamentos Antigos Processados: ${oldPayments.length}`);
    console.log(
      `- Planos Financeiros Vinculados/Atualizados: ${successCount} ✅`
    );
    console.log(
      `- Planos Criados para Pagamentos Ausentes: ${createdCount} ✨`
    );
    console.log(`- Falhas/Planos Não Encontrados: ${notFoundCount} ⚠️`);
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("Erro durante a migração de pagamentos:", error);
    // Rejeita a promessa para ser capturado pelo .catch()
    throw new Error("Falha na migração de pagamentos.");
  } finally {
    console.log("Migração de pagamentos finalizada.\n");
    await mongoose.disconnect(); // Fecha a conexão com o banco de dados
  }
}

migratePaymentsToFinancialPlan().catch((err) => {
  console.error("Erro fatal na migration:", err.message);
  // O disconnect já é chamado no 'finally' da função principal,
  // mas aqui garante que se cair antes do 'finally' a conexão será fechada.
  if (mongoose.connection.readyState === 1) {
    mongoose.disconnect();
  }
});
