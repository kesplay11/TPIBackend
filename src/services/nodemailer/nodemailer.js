const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuramos el transporte
const transporter = nodemailer.createTransport({
  service: 'gmail', // o 'outlook', 'yahoo', etc., según el correo que uses
  auth: {
    user: process.env.EMAIL_USER, // tu correo
    pass: process.env.EMAIL_PASS  // tu contraseña o app password
  }
});

/**
 * Envía un correo electrónico
 * @param {string} to - Correo destino
 * @param {string} subject - Asunto del correo
 * @param {string} html - Contenido HTML del correo
 */
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Intertecnos App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log('📨 Correo enviado: ', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    throw error;
  }
}

module.exports = { sendEmail };
