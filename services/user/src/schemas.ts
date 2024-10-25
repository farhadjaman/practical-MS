import { z } from "zod";

export const UserCreateSchema = z.object({
  authUserId: z.string(),
  name: z.string(),
  email: z.string().email(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

//omit: user cant update authUserId. partial: user can update only name, email, address, phone and all of them are optional
export const UserUpdateSchema = UserCreateSchema.omit({
  authUserId: true,
}).partial();
