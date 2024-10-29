import { jwtSecret } from "@/config";
import prisma from "@/prisma";
import { AccessTokenSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const verfiyToken = async (req:Request,res: Response, next:NextFunction) => {
  try {
    const parsedBody = AccessTokenSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({ message: "Invalid request body" });
      return;
    }

    const { accessToken } = parsedBody.data;
    const decoded = jwt.verify(accessToken, jwtSecret);

    if(!decoded){
      res.status(401).json({message: "Unauthorized"});
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "unauthorized" });
      return;
    }

    res.status(200).json({ message: "Authorized", user });
  } catch (error) {
    next(error);
  }
};

export default verfiyToken;
