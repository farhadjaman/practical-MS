import prisma from "@/prisma";
import { User } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

// /users/:id?field=id|authUserId
const getUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const field = req.query.field as string;
    let user: User | null = null;

    if (field !== "id" && field !== "authUserId") {
      res.status(400).json({
        message: "Invalid field",
      });
      return;
    }

    if (field === "id") {
      user = await prisma.user.findUnique({ where: { id } });
    }

    if (field === "authUserId") {
      user = await prisma.user.findUnique({ where: { authUserId: id } });
    }

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.status(200).json(user);
    return;
  } catch (error) {
    next(error);
  }
};

export default getUserDetails;
