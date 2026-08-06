import { jwtVerify, SignJWT } from "jose";

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

interface TokenPayload {
  userId: string;
  role: string;
}

export async function verifyAccessTokenEdge(
  token: string,
): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return { userId: payload.userId as string, role: payload.role as string };
}

export async function verifyRefreshTokenEdge(
  token: string,
): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return { userId: payload.userId as string, role: payload.role as string };
}
