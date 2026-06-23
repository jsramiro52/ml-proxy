import { getUser, verifyPassword, createToken, seedAdminIfEmpty, COOKIE_NAME } from "../../../lib/auth";
import { serialize } from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Faltan datos" });

  try {
    await seedAdminIfEmpty();
    const user = await getUser(username);
    if (!user) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

    const token = await createToken({ sub: user.username, name: user.name, role: user.role });
    res.setHeader("Set-Cookie", serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }));
    res.status(200).json({ ok: true, user: { username: user.username, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
