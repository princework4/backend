/* eslint-disable no-undef */
const path = require('path');
const ErrorHandler = require('./errorHandler');
require('dotenv').config();
const ejs = require('ejs');
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST, // Replace with your SMTP server host
            port: process.env.SMTP_PORT, // Replace with your SMTP server port
            service: process.env.SMTP_SERVICE, // Ensure this is correctly configured
            auth: {
                user: process.env.SMTP_MAIL, // Replace with your SMTP server email
                pass: process.env.SMTP_PASSWORD // Replace with your SMTP server password
            }
        });

        const { email, subject, template, data } = options;

        // Define the path to the EJS template
        const templatePath = path.join(__dirname, '../mails', template);

        // Render email template with ejs
        const html = await ejs.renderFile(templatePath, data);

        // Define the email options
        const mailOptions = {
            from: process.env.SMTP_MAIL, // Replace with your sender email
            to: email,
            subject: subject,
            html: html
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log("mail sent");

    } catch (error) {
        console.error(`Error sending activation email: ${error.message}`);
        // Forward the error using ErrorHandler
        throw new ErrorHandler(`Error sending activation email: ${error.message}`, 500);
    }
};

module.exports = sendEmail;
