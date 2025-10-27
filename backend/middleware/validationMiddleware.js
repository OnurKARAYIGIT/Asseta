const Joi = require("joi");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false, // Tüm hataları aynı anda raporla
    stripUnknown: true, // Şemada tanımlanmamış alanları veriden temizle
  });

  if (error) {
    // Hata mesajlarını birleştirerek daha anlaşılır bir çıktı oluştur
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    res.status(400);
    // Express'in merkezi hata yakalama mekanizmasına devret
    return next(new Error(errorMessage));
  }

  return next();
};

module.exports = validate;
