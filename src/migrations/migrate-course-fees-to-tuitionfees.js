const mongoose = require("mongoose");
require("dotenv").config();

async function runMigration() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.error("MONGO_URL não definido");
    return;
  }

  await mongoose.connect(uri);

  const Courses = mongoose.connection.collection("courses");
  const TuitionFees = mongoose.connection.collection("tuitionfees");

  console.log("Buscando cursos com campos financeiros...");

  const courses = await Courses.find({
    $or: [
      { fee: { $exists: true } },
      { feeFine: { $exists: true } },
      { enrollmentFee: { $exists: true } }
    ]
  }).toArray();

  console.log(`Encontrados ${courses.length} cursos para migrar.`);

  for (const course of courses) {
    // Criar tuition fee baseado no curso
    await TuitionFees.insertOne({
      courseId: course._id,
      fee: course.fee ?? 0,
      feeFine: course.feeFine ?? 0,
      enrollmentFee: course.enrollmentFee ?? 0,
      confirmationEnrollmentFee: 0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Remover campos financeiros do curso
    await Courses.updateOne(
      { _id: course._id },
      {
        $unset: {
          fee: "",
          feeFine: "",
          enrollmentFee: ""
        }
      }
    );

    console.log(`Curso migrado: ${course._id}`);
  }

  console.log("Migration concluída com sucesso.");
  await mongoose.disconnect();
}

runMigration().catch(async (err) => {
  console.error("Erro na migration:", err);
  await mongoose.disconnect();
});
