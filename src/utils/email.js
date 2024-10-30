const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
dotenv.config()
const sendEmail = async (option) =>{
    var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "bb1f2b25f7718a",
          pass: "7b22f58a9ab1c2"
        }
      });
    const emailOptions = {
        from: 'service support<support@service.com>',
        to: option.email,
        subject: option.subject,
        text: option.message
    }
    await transport.sendMail(emailOptions)
}
module.exports = sendEmail