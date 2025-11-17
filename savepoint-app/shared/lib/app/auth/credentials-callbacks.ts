import { prisma } from "../db";
import { verifyPassword } from "../password";

export async function onAuthorize(
  credentials: Partial<Record<"email" | "password", unknown>>
) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }
  const normalizedEmail = (credentials.email as string).trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      password: true,
    },
  });
  if (!user || !user.password) {
    return null;
  }
  const isPasswordValid = await verifyPassword(
    credentials.password as string,
    user.password
  );
  if (!isPasswordValid) {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  };
}
