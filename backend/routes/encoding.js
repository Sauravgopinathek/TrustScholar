/**
 * ============================================================
 * ENCODING ROUTES
 * Implements: Base64 Encoding/Decoding (non-QR)
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorization');
const { encodeBase64, decodeBase64 } = require('../utils/encoding');

// Encode text to Base64
router.post('/base64/encode',
  verifyToken,
  requireRole('student', 'officer', 'admin'),
  [body('text').isString().notEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { text } = req.body;
    const encoded = encodeBase64(text);

    res.json({
      success: true,
      data: { encoded }
    });
  }
);

// Decode Base64 to text
router.post('/base64/decode',
  verifyToken,
  requireRole('student', 'officer', 'admin'),
  [body('encoded').isString().notEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { encoded } = req.body;
    const decoded = decodeBase64(encoded);

    res.json({
      success: true,
      data: { decoded }
    });
  }
);

module.exports = router;
