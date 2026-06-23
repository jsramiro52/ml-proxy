import { serialize } from "cookie";
import { COOKIE_NAME } from "../../../lib/auth";

export default function handler(req, res) {
  res.setHeader("Set-Cookie", serialize(COOKIE_NAME, "", { path: "/", maxAge: 0 }));
  res.status(200).json({ ok: true });
}
