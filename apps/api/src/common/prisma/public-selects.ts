import { Prisma } from '@prisma/client';

export const publicUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  name: true,
  role: true,
  disabledAt: true,
  provisionedBy: true
});

export type PublicUserRecord = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;
