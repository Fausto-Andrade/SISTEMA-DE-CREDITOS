const express = require('express');
const router = express.Router();
const docController = require('../controllers/docController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear la carpeta si no existe
const dir = './uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post('/cargar', upload.array('documentos', 5), docController.subirDocumentos);

module.exports = router;