import prisma from "@/prisma";
import { NextFunction, Request, Response } from "express";

const getProducts = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        price: true,
        inventoryId: true,
      },
    });

    //TODOS implement pagination
    //TODOs implement filtering

    res.status(201).json({ data: products });
  } catch (error) {
    next(error);
  }
};

export default getProducts;
