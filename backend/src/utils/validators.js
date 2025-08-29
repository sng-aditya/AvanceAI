const { body, validationResult } = require('express-validator');

module.exports = {
  validateRegister: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  validateLogin: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ]
};