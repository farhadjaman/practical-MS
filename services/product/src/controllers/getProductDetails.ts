import { inventoryUrl } from "@/config";
import prisma from "@/prisma";
import axios from "axios";
import { NextFunction, Request, Response } from "express";

const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    if (!product.inventoryId) {
      const {
        data: { inventory },
      } = await axios.post(`${inventoryUrl}/inventories`, {
        productId: product.id,
        sku: product.sku,
      });

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

      res
        .status(201)
        .json({
          ...product,
          inventoryId: inventory.id,
          stock: inventory.quantity,
          stockStatus: inventory.quantity > 0 ? "In Stock" : "Out of Stock",
        });
    }
    const {
      data: { inventory },
    } = await axios.get(`${inventoryUrl}/inventories/${product.inventoryId}`);

    res
      .status(201)
      .json({
        ...product,
        stock: inventory.quantity,
        stockStatus: inventory.quantity > 0 ? "In Stock" : "Out of Stock",
      });
  } catch (error) {
    next(error);
  }
};

export default getProductDetails;
