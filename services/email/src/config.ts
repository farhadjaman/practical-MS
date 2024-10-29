import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  // secure: false,
  // auth: {
  //   user: process.env.SMTP_USER,
  //   pass: process.env.SMTP_PASSWORD,
  // },
});

export const defaultSenderEmail =
  process.env.DEFAULT_SENDER_EMAIL || "admin@example.com";
