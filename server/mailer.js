const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendActivationEmail(to, name) {
  try {
    const info = await transporter.sendMail({
      from: '"OGSUNENTERPRISE" <' + process.env.EMAIL_USER + '>',
      to: to,
      subject: 'Kont ou aktive sou OGSUNENTERPRISE!',
      html: `<h2>Bonjou ${name},</h2>
             <p>Kont afilye ou sou OGSUNENTERPRISE fenk aktive ak siksè.</p>
             <p>Ou ka kounye a konekte sou espas afilye w pou w kòmanse fè pwomosyon epi jenere komisyon.</p>
             <br>
             <p>Ekip OGSUNENTERPRISE</p>`
    });
    console.log('Email voye bay:', to);
  } catch (error) {
    console.error('Erè pandan l ap voye email:', error.message);
  }
}

module.exports = { sendActivationEmail };
