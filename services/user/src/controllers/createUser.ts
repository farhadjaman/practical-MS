import prisma from "@/prisma";
import { UserCreateSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = UserCreateSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    //check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        authUserId: parsedBody.data.authUserId,
      },
    });

    if (existingUser) {
      res.status(400).json({ error: "Product already exists" });
      return;
    }

    const user = await prisma.user.create({
      data: {
        ...parsedBody.data,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export default createUser;
