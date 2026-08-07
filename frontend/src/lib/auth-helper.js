import { verifyToken } from "./jwt";
import { prisma } from "./prisma";

export async function getAuthenticatedUser(request) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || !payload.user_id) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.user_id },
  });

  return user;
}
