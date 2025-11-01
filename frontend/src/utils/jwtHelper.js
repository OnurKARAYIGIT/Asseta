/**
 * Basit bir JWT payload çözümleyici.
 * @param {string} token Çözümlenecek JWT.
 * @returns {object|null} Token payload'u veya hata durumunda null.
 */
export const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};
