import { createTRPCRouter, publicProcedure } from "../trpc";
import * as z from "zod";
import {hashPassword} from "../../../utils/auth"
import type { User } from "@prisma/client";

export const usersRouter = createTRPCRouter({
  signup: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx  }) => {
      const hashedPassword = await hashPassword(input.password);
      const user: User = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
        },
      });
      return user;
    }),
});
