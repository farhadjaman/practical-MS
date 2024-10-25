// Avoid importing from '@/controllers' here to prevent circular dependencies
import { inventoryUrl } from "@/config";
import prisma from "@/prisma";
import { ProductCreateDTOSchema } from "@/schemas";
import axios from "axios";
import { NextFunction, Request, Response } from "express";

const createInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsedBody = ProductCreateDTOSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        sku: parsedBody.data.sku,
      },
    });

    if (existingProduct) {
      res.status(400).json({ error: "Product already exists" });
      return;
    }

    const product = await prisma.product.create({
      data: {
        ...parsedBody.data,
      },
    });
    console.log("product created successfully", product.id);

    //create inventory record for the product

    const { data: inventory } = await axios.post(
      `${inventoryUrl}/inventories`,
      {
        productId: product.id,
        sku: product.sku,
      },
    );

    console.log("inventory created successfully", inventory.id);

    // update product and store associated inventory id
    await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        inventoryId: inventory.id,
      },
    });

    res.status(201).json({ ...product, inventoryId: inventory.id });
  } catch (error) {
    next(error);
  }
};

export default createInventory;
