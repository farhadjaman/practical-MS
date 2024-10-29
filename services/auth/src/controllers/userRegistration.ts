import { emailServiceUrl, userServiceUrl } from "@/config";
import prisma from "@/prisma";
import { UserCreateSchema } from "@/schemas";
import axios from "axios";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";

const generateVerificationToken = () => {
  // get current timestamp in miliseconds
  const timestamp = new Date().getTime().toString();

  // generate random string
  const randomString = Math.floor(10 + Math.random() * 90).toString();

  // combine timestamp and random string
  const token = (timestamp + randomString).slice(-5);

  return token;
};
const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsedBody = UserCreateSchema.safeParse(req.body);

    console.log("auth service config", process.env.USER_SERVICE_URL);

    if (!parsedBody.success || !parsedBody.data) {
      res.status(400).json({ message: parsedBody.error.errors });
      return;
    }

    //check if user already exist
    const existingUser = await prisma.user.findFirst({
      where: {
        email: parsedBody.data?.email,
      },
    });

    if (existingUser) {
      res.status(400).json({ message: "User already exist" });
    }

    //hash password
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(parsedBody.data.password, salt);

    //create user
    const user = await prisma.user.create({
      data: {
        ...parsedBody.data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        verfied: true,
      },
    });

    // create user profile by calling the user service
    await axios.post(`${userServiceUrl}/users`, {
      authUserId: user.id,
      name: user.name,
      email: user.email,
    });
    console.log("User created", user);

    // generate verification token
    const verificationToken = generateVerificationToken();
    await prisma.verificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // send verification email
    await axios.post(`${emailServiceUrl}/emails/send`, {
      recipient: user.email,
      subject: "Verify your email",
      body: `Use this token to verify your email: ${verificationToken}`,
      source: "user-registration",
    });

    res.status(201).json({
      message:
        "User created successfully. check your email for verficiation coode",
      user,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export default userRegistration;
