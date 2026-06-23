import { verifyToken, COOKIE_NAME } from "../../../lib/auth";
import { parse } from "cookie";

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "No autenticado" });
  const payload = await verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Token inválido" });
  res.status(200).json({ username: payload.sub, name: payload.name, role: payload.role });
}
