import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { Redis } from "@upstash/redis";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);
const COOKIE_NAME = "auth_token";

// Redis client (lazy init so it doesn't crash at build time)
let _redis;
function getRedis() {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

// JWT helpers
export async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// Password helpers
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}
export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// User store (Upstash Redis)
export async function getUser(username) {
  const redis = getRedis();
  return redis.hgetall(`user:${username.toLowerCase()}`);
}

export async function createUser({ username, name, password, role }) {
  const redis = getRedis();
  const key = username.toLowerCase();
  const existing = await redis.exists(`user:${key}`);
  if (existing) throw new Error("El usuario ya existe");
  const password_hash = await hashPassword(password);
  const user = { username: key, name, password_hash, role, created_at: new Date().toISOString() };
  await redis.hset(`user:${key}`, user);
  await redis.sadd("usernames", key);
  return user;
}

export async function deleteUser(username) {
  const redis = getRedis();
  const key = username.toLowerCase();
  await redis.del(`user:${key}`);
  await redis.srem("usernames", key);
}

export async function listUsers() {
  const redis = getRedis();
  const names = await redis.smembers("usernames");
  if (!names?.length) return [];
  const users = await Promise.all(
    names.map(async (n) => {
      const u = await redis.hgetall(`user:${n}`);
      return u ? { ...u, password_hash: undefined } : null;
    })
  );
  return users.filter(Boolean).sort((a, b) => a.username.localeCompare(b.username));
}

export async function seedAdminIfEmpty() {
  const redis = getRedis();
  const count = await redis.scard("usernames");
  if (count === 0 && process.env.INITIAL_ADMIN_PASSWORD) {
    await createUser({
      username: "admin",
      name: "Administrador",
      password: process.env.INITIAL_ADMIN_PASSWORD,
      role: "admin",
    });
  }
}

export { COOKIE_NAME };
