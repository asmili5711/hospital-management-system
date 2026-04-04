const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('supertest');

const doctorUpload = require('../middleware/doctorUpload');
const uploadDir = path.join(__dirname, '..', 'public', 'images');

describe('doctor upload middleware', () => {
  test('rejects disguised non-image content', async () => {
    const app = express();

    app.post('/upload', doctorUpload.single('imageFile'), (req, res) => {
      return res.status(200).json({
        uploadErrorCode: req.uploadErrorCode || '',
        hasFile: Boolean(req.file)
      });
    });

    const response = await request(app)
      .post('/upload')
      .attach('imageFile', Buffer.from('not a real jpeg file'), {
        filename: 'fake.jpg',
        contentType: 'image/jpeg'
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      uploadErrorCode: 'invalid_file_content',
      hasFile: false
    });
  });

  test('accepts a valid AVIF upload', async () => {
    const app = express();

    app.post('/upload', doctorUpload.single('imageFile'), (req, res) => {
      return res.status(200).json({
        uploadErrorCode: req.uploadErrorCode || '',
        hasFile: Boolean(req.file),
        filename: req.file ? req.file.filename : '',
        detectedMime: req.file ? req.file.detectedMime : ''
      });
    });

    const avifBuffer = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x18]),
      Buffer.from('ftyp'),
      Buffer.from('avif'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('mif1')
    ]);

    const response = await request(app)
      .post('/upload')
      .attach('imageFile', avifBuffer, {
        filename: 'sample.avif',
        contentType: 'image/avif'
      });

    expect(response.status).toBe(200);
    expect(response.body.uploadErrorCode).toBe('');
    expect(response.body.hasFile).toBe(true);
    expect(response.body.detectedMime).toBe('image/avif');
    expect(response.body.filename).toMatch(/\.avif$/);

    await fs.promises.unlink(path.join(uploadDir, response.body.filename));
  });
});
