import prisma from "@/prisma";
import { UserLoginSchema } from "@/schemas";
import { LoginAttempt } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type LoginHistory = {
  userId: string;
  ipAddress: string | undefined;
  userAgent: string | undefined;
  attempt: LoginAttempt;
};

const createLoginHistory = async (info: LoginHistory) => {
  await prisma.loginHistory.create({
    data: {
      userId: info.userId,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      loginAttempt: info.attempt,
    },
  });
};

const userLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req)
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.ip || "";
    const userAgent = req.headers["user-agent"] || "";
    console.log(
      `Login attempt from IP address: ${ipAddress} and User Agent: ${userAgent}`,
    );

    const parsedBody = UserLoginSchema.safeParse(req.body);

    if (!parsedBody.success || !parsedBody.data) {
      res.status(400).json({ message: parsedBody.error.errors });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        email: parsedBody.data.email,
      },
    });

    if (!user) {
      await createLoginHistory({
        userId: "Guest",
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    //compare password
    const isMatch = await bcrypt.compare(
      parsedBody.data.password,
      user.password,
    );

    if (!isMatch) {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    //check if the user is verified
    if (!user.verfied) {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });
      res.status(400).json({ message: "User not verified" });
      return;
    }

    //check if the user is active
    if (user.status !== "ACTIVE") {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });
      res.status(400).json({ message: "User is not active" });
      return;
    }

    //generate token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET ?? "my_service_key",
      {
        expiresIn: "2h",
      },
    );

    await createLoginHistory({
      userId: user.id,
      ipAddress,
      userAgent,
      attempt: "SUCCESS",
    });

    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
};

export default userLogin;
