import multer from "multer";
import path from "path";

// Configuração de armazenamento
const storage = multer.memoryStorage();

const storageDisk = multer.diskStorage({
  destination: function (req, file, cb) {
    // Salva os arquivos na pasta "uploads/imgs"
    cb(null, path.resolve(__dirname, "../uploads/imgs"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const storageDiskDocs = multer.diskStorage({
  destination: function (req, file, cb) {
    // Salva os arquivos na pasta "uploads/imgs"
    cb(null, path.resolve(__dirname, "../uploads/docs"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Função para filtrar tipos de arquivos (permitir apenas imagens e PDF)
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedFileTypes = /jpeg|jpg|png|pdf/;
  const extName = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeType = allowedFileTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo de arquivo inválido. Apenas JPEG, PNG e PDF são permitidos."
      )
    );
  }
};

const fileConfig = {
  limits: { fileSize: 1000000 }, // Limite de 1MB
  fileFilter: fileFilter,
};

// Configuração de upload com limite de tamanho e validação de tipo de arquivo
export const uploadDisk = multer({
  storage: storageDisk,
  ...fileConfig,
});

export const upload = multer({
  storage,
  ...fileConfig,
});

export const uploadDiskDocs = multer({
  storage: storageDiskDocs,
  ...fileConfig,
});
