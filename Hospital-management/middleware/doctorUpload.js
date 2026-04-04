const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'public', 'images');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_TYPES = new Map([
  ['image/jpeg', ['.jpg', '.jpeg']],
  ['image/png', ['.png']],
  ['image/webp', ['.webp']],
  ['image/avif', ['.avif']]
]);

const hasIsobmffBrand = (buffer, allowedBrands) => {
  const scanLimit = Math.min(buffer.length, 32);

  for (let offset = 8; offset + 4 <= scanLimit; offset += 4) {
    const brand = buffer.subarray(offset, offset + 4).toString('ascii');
    if (allowedBrands.includes(brand)) {
      return true;
    }
  }

  return false;
};

const IMAGE_SIGNATURES = [
  {
    mime: 'image/jpeg',
    ext: '.jpg',
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
  },
  {
    mime: 'image/png',
    ext: '.png',
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
  },
  {
    mime: 'image/webp',
    ext: '.webp',
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  },
  {
    mime: 'image/avif',
    ext: '.avif',
    matches: (buffer) =>
      buffer.length >= 16 &&
      buffer.subarray(4, 8).toString('ascii') === 'ftyp' &&
      hasIsobmffBrand(buffer, ['avif', 'avis'])
  }
];

const memoryStorage = multer.memoryStorage();

const buildFilename = (ext) =>
  `doctor-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

const detectImageType = (buffer) =>
  IMAGE_SIGNATURES.find((signature) => signature.matches(buffer)) || null;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();


  
  const allowedExtensions = ALLOWED_TYPES.get(file.mimetype);

  if (!allowedExtensions || !allowedExtensions.includes(ext)) {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
    error.code = 'INVALID_FILE_TYPE';
    return cb(error);
  }

  cb(null, true);
};

const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const mapUploadErrorCode = (error) => {
  if (!error) return '';
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return 'file_too_large';
    if (error.code === 'INVALID_FILE_TYPE' || error.code === 'LIMIT_UNEXPECTED_FILE') {
      return 'invalid_file_type';
    }
  }

  return 'upload_failed';
};

const persistValidatedFile = async (file) => {
  const detectedType = detectImageType(file.buffer || Buffer.alloc(0));
  if (!detectedType) {
    const error = new Error('Invalid image content');
    error.code = 'INVALID_FILE_CONTENT';
    throw error;
  }

  if (file.mimetype !== detectedType.mime) {
    const error = new Error('Image content does not match MIME type');
    error.code = 'INVALID_FILE_CONTENT';
    throw error;
  }

  const filename = buildFilename(detectedType.ext);
  const destinationPath = path.join(uploadDir, filename);
  await fs.promises.writeFile(destinationPath, file.buffer);

  file.filename = filename;
  file.path = destinationPath;
  file.detectedMime = detectedType.mime;
  delete file.buffer;
};

const single = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, async (error) => {
    if (error) {
      req.uploadErrorCode = mapUploadErrorCode(error);
      return next();
    }

    if (!req.file) {
      return next();
    }

    try {
      await persistValidatedFile(req.file);
      return next();
    } catch (persistError) {
      req.file = undefined;
      req.uploadErrorCode =
        persistError && persistError.code === 'INVALID_FILE_CONTENT'
          ? 'invalid_file_content'
          : 'upload_failed';
      return next();
    }
  });
};

module.exports = {
  single
};
