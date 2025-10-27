const mongoose = require("mongoose");
const { getMonthsBetween } = require("./getMonth-in-school-year.js");
require("dotenv").config();

async function runMigration() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.error("Indique uma url no .env (MONGO_URL)");
    return;
  }

  await mongoose.connect(uri);

  const EnrollmentCollection = mongoose.connection.collection("enrollments");
  const FinancialPlanCollection =
    mongoose.connection.collection("financialplans");
  const SchoolYearCollection = mongoose.connection.collection("schoolyears");
  const ClassesCollection = mongoose.connection.collection("classes");
  const CoursesCollection = mongoose.connection.collection("courses");

  const centerId = new mongoose.Types.ObjectId("67db04c75befeca56ad12aee");

  console.log(`Buscando ano letivo atual para o centro ${centerId}...`);

  const schoolYear = await SchoolYearCollection.findOne({
    center: centerId,
    isCurrent: true,
  });

  if (!schoolYear) {
    throw new Error("Ano letivo atual não encontrado.");
  }

  console.log("Buscando matrículas...");
  const enrollments = await EnrollmentCollection.find({ centerId }).toArray();

  console.log(`Encontradas ${enrollments.length} matrículas.`);

  for (const enrollment of enrollments) {
    // 🔎 buscar turma e curso manualmente

    const months = getMonthsBetween(
      enrollment.enrollmentDate < schoolYear.startDate
        ? schoolYear.startDate
        : enrollment.enrollmentDate,
      schoolYear.endDate
    );

    const classDoc = await ClassesCollection.findOne({
      _id: enrollment.classId,
    });

    if (!classDoc) {
      console.warn(`Turma não encontrada para matrícula ${enrollment._id}`);
      continue;
    }

    const courseDoc = await CoursesCollection.findOne({ _id: classDoc.course });
    if (!courseDoc) {
      console.warn(`Curso não encontrado para matrícula ${enrollment._id}`);
      continue;
    }

    console.log(`Criando planos para aluno ${enrollment.userId}...`);

    for (const resultMonth of months) {
      //coloca a data do proximo pagamento no dia 10 do proximo mes e se for dezembro, coloca em janeiro do outro ano
      const dueDate = new Date(resultMonth.year, resultMonth.monthInNumber, 10);

      await FinancialPlanCollection.insertOne({
        schoolYear: schoolYear._id,
        month: resultMonth.month,
        year: resultMonth.year,
        dueDate,
        enrollmentId: enrollment._id,
        centerId: enrollment.centerId,
        userId: enrollment.userId,
        tutionFee: courseDoc.fee,
        status: "pending",
      });

      console.log(
        `Plano criado: ${resultMonth.month}/${resultMonth.year} para aluno ${enrollment.userId}`
      );
    }
  }

  console.log("✅ Migration finalizada!");
  await mongoose.disconnect();
}

runMigration().catch(async (err) => {
  console.error("Erro na migration:", err);
  await mongoose.disconnect();
});
