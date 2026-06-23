import { listUsers, createUser, deleteUser, verifyToken, COOKIE_NAME } from "../../../lib/auth";
import { parse } from "cookie";

async function getAuthUser(req) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}

export default async function handler(req, res) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "admin")
    return res.status(403).json({ error: "Acceso denegado" });

  if (req.method === "GET") {
    const users = await listUsers();
    return res.status(200).json(users);
  }

  if (req.method === "POST") {
    const { username, name, password, role } = req.body || {};
    if (!username || !name || !password || !role)
      return res.status(400).json({ error: "Faltan campos: username, name, password, role" });
    if (!["admin", "consulta"].includes(role))
      return res.status(400).json({ error: "Rol inválido (admin | consulta)" });
    try {
      await createUser({ username, name, password, role });
      return res.status(201).json({ ok: true });
    } catch (err) {
      return res.status(409).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    const { username } = req.body || {};
    if (!username) return res.status(400).json({ error: "Falta username" });
    if (username === user.sub) return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
    await deleteUser(username);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
