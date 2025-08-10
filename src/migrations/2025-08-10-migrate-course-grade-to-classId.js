const mongoose = require("mongoose");
require("dotenv").config()

async function runMigration() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.error("Indique uma url")
    return;
  }
  await mongoose.connect(process.env.MONGO_URL);

  const Enrollment = mongoose.connection.collection("enrollments");
  const Classes = mongoose.connection.collection("classes");

  console.log("Buscando documentos antigos...");
  const oldDocs = await Enrollment.find({
    classId: { $exists: false },
    courseId: { $exists: true },
    grade: { $exists: true },
  }).toArray();

  console.log(`Encontrados ${oldDocs.length} documentos para migrar.`);

  for (const doc of oldDocs) {
    const matchingClass = await Classes.findOne({
      "course": new mongoose.Types.ObjectId(doc.courseId),
      "grade": new mongoose.Types.ObjectId(doc.grade),
    });

    if (!matchingClass) {
      console.warn(`Nenhuma turma encontrada para enrollment ${doc._id}`);
      continue;
    }

    await Enrollment.updateOne(
      { _id: doc._id },
      {
        $set: {
          classId: matchingClass._id,
        },
        $unset: {
          courseId: "",
          grade: "",
        },
      }
    );

    console.log(`Migrado enrollment ${doc._id}`);
  }

  console.log("Migration finalizada!");
  await mongoose.disconnect();
}

runMigration().catch(async (err) => {
  console.error("Erro na migration:", err);
  await mongoose.disconnect();
});
