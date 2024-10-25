import prisma from "@/prisma";
import { InventoryUpdateDTOSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";

const updateInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const inventory = await prisma.inventory.findUnique({
      where: {
        id,
      },
    });
    if (!inventory) {
      res.status(404).json({ error: "Inventory not found" });
      return;
    }

    const parsedBody = InventoryUpdateDTOSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.errors });
      return;
    }

    const lastHistory = await prisma.history.findFirst({
      where: {
        inventoryId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!lastHistory) {
      res.status(400).json({ error: "Inventory history not found" });
      return;
    }

    if (
      inventory.quantity < parsedBody.data.quantity &&
      parsedBody.data.actionType === "OUT"
    ) {
      res.status(400).json({ error: "Not enough quantity to take out" });
      return;
    }

    //calculate the new quantity
    let newQuantity = inventory.quantity;
    if (parsedBody.data.actionType === "IN") {
      newQuantity += parsedBody.data.quantity;
    } else {
      newQuantity -= parsedBody.data.quantity;
    }

    const updatedInventory = await prisma.inventory.update({
      where: {
        id,
      },
      data: {
        quantity: newQuantity,
        histories: {
          create: {
            actionType: parsedBody.data.actionType,
            quantityChanged: parsedBody.data.quantity,
            lastQuantity: lastHistory?.newQuantity || 0,
            newQuantity,
          },
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    res.status(201).json(updatedInventory);
  } catch (error) {
    next(error);
  }
};

export default updateInventory;
