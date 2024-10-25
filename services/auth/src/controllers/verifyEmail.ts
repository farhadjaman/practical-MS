import { emailServiceUrl } from "@/config";
import prisma from "@/prisma";
import { EmailVerificationSchema } from "@/schemas";
import axios from "axios";
import { NextFunction, Request, Response } from "express";


const verfiyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction,
)=>{
    try {

        const parsedBody = EmailVerificationSchema.safeParse(req.body);

        if (!parsedBody.success) {
            res.status(400).json({ message: parsedBody.error.errors });
            return;
        }

        const { token, email} = parsedBody.data;

        const user = await prisma.user.findFirst({
            where: {
                email,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                userId: user.id,
                token,
            },
        });

        if (!verificationToken) {
            res.status(404).json({ message: "Invalid token" });
            return;
        }

        if(verificationToken.expiresAt < new Date()){
            res.status(404).json({ message: "Token expired" });
            return;
        }

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                verfied: true,
                status: "ACTIVE",
            },
        });

        //update verification token status
        await prisma.verificationToken.update({
            where: {
                id: verificationToken.id,
            },
            data: {
                status: "EXPIRED",
                verifiedAt: new Date(),
            },
        });

        //send success email

        await axios.post(`${emailServiceUrl}/emails/send`, {
            recipient: user.email,
            subject: "Email Verification",
            body: "Your email has been successfully verified",
            source: "email-verification",
        })

        res.status(200).json({ message: "Email verified successfully" });

    } catch (error) {
        next(error);
    }


}


export default verfiyEmail;