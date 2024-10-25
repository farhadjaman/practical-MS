import { defaultSenderEmail, transporter } from "@/config";
import prisma from "@/prisma";
import { EmailCreateSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";

const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = EmailCreateSchema.safeParse(req.body);

    if (!parsedBody.success) {
      console.log(parsedBody.error.errors);
      res.status(400).json({ message: "Invalid request body" });
      return;
    }

    const { body, recipient, subject, sender, source } = parsedBody.data;
    const from = sender || defaultSenderEmail;

    const emailOptions = {
      from,
      to: recipient,
      subject,
      text: body,
    };

    // send the email

    console.log("host", process.env.SMTP_HOST);
    console.log("port", process.env.SMTP_PORT);

    const { rejected } = await transporter.sendMail(emailOptions);

    if (rejected.length) {
      console.log("Email rejected", rejected);
      res.status(500).json({ message: "Email sent Failed" });
      return;
    }

    await prisma.email.create({
      data: {
        body,
        recipient,
        subject,
        sender: from,
        source: source || "API",
      },
    });
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    next(error);
  }
};

export default sendEmail;
