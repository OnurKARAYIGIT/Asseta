const Joi = require("joi");

const registerUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    "string.empty": `Kullanıcı adı boş bırakılamaz.`,
    "string.min": `Kullanıcı adı en az 3 karakter olmalıdır.`,
    "any.required": `Kullanıcı adı zorunludur.`,
  }),
  email: Joi.string().email().required().messages({
    "string.email": `Lütfen geçerli bir e-posta adresi girin.`,
    "any.required": `E-posta zorunludur.`,
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": `Şifre en az 6 karakter olmalıdır.`,
    "any.required": `Şifre zorunludur.`,
  }),
  phone: Joi.string()
    .pattern(/^05\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": `Telefon numarası '05' ile başlamalı ve 11 haneli olmalıdır.`,
    }),
  position: Joi.string().required(),
  role: Joi.string().valid("user", "admin", "developer").optional(),
});

module.exports = {
  registerUserSchema,
};
