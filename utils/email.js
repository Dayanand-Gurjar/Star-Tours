const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //1) Transporter

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //2)Define email options
  const mailOptions = {
    from: "Star tours <admin@startours.ac.in>",
    to: 'dayanandgurjar05@gmail.com',
    subject: options.subject,
    text: options.message,
  };

  //3)Send email
  let info = await transporter.sendMail(mailOptions);
  console.log("Message sent: %s", info.messageId);
};

module.exports = sendEmail;
