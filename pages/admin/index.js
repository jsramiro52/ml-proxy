import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const ROLES = { admin: "Administrador", consulta: "Consulta" };
const roleColor = { admin: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", consulta: "bg-blue-500/20 text-blue-300 border-blue-500/30" };

export default function AdminUsers() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", name: "", password: "", role: "consulta" });
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(u => {
      if (!u || u.role !== "admin") { router.push("/"); return; }
      setMe(u);
      loadUsers();
    });
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/users");
    if (r.ok) setUsers(await r.json());
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const r = await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const d = await r.json();
    if (r.ok) {
      setMsg({ type: "ok", text: `Usuario '${form.username}' creado` });
      setForm({ username: "", name: "", password: "", role: "consulta" });
      loadUsers();
    } else {
      setMsg({ type: "err", text: d.error });
    }
    setSaving(false);
  };

  const handleDelete = async (username) => {
    if (!confirm(`¿Eliminar usuario '${username}'?`)) return;
    const r = await fetch("/api/admin/users", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }),
    });
    if (r.ok) { setMsg({ type: "ok", text: `'${username}' eliminado` }); loadUsers(); }
    else { const d = await r.json(); setMsg({ type: "err", text: d.error }); }
  };

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">⚙️ Gestión de Usuarios</h1>
            <p className="text-gray-400 text-sm">Hola, {me?.name}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition">
              ← Dashboard
            </Link>
            <button onClick={logout} className="bg-red-800/50 hover:bg-red-700/50 text-red-300 text-sm px-4 py-2 rounded-lg transition">
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* User list */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-gray-300 font-semibold mb-4 text-sm uppercase tracking-wide">Usuarios activos</h2>
          {loading ? (
            <p className="text-gray-500 text-sm animate-pulse">Cargando…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-4 font-medium">Usuario</th>
                  <th className="text-left py-2 pr-4 font-medium">Nombre</th>
                  <th className="text-left py-2 pr-4 font-medium">Rol</th>
                  <th className="text-left py-2 pr-4 font-medium">Creado</th>
                  <th className="text-right py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.username} className="border-b border-gray-700/50">
                    <td className="py-2.5 pr-4 font-mono text-gray-300">{u.username}</td>
                    <td className="py-2.5 pr-4 text-white">{u.name}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${roleColor[u.role] || ""}`}>
                        {ROLES[u.role] || u.role}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 text-xs">{u.created_at?.slice(0, 10)}</td>
                    <td className="py-2.5 text-right">
                      {u.username !== me?.username && (
                        <button onClick={() => handleDelete(u.username)} className="text-red-400 hover:text-red-300 text-xs">
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!users.length && <tr><td colSpan={5} className="py-4 text-gray-500 text-center">Sin usuarios</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Create user form */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-gray-300 font-semibold mb-4 text-sm uppercase tracking-wide">Crear usuario</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Usuario (sin espacios)</label>
              <input value={form.username} onChange={e => setForm({...form, username: e.target.value.toLowerCase().replace(/\s/g,"")})}
                required className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="juan_ventas" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Nombre completo</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                required className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Juan García" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Contraseña</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                required minLength={6} className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Rol</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                <option value="consulta">Consulta (solo lectura)</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {msg && (
              <div className={`sm:col-span-2 rounded-lg px-4 py-2.5 text-sm ${msg.type === "ok" ? "bg-green-900/40 text-green-300 border border-green-500/30" : "bg-red-900/40 text-red-300 border border-red-500/30"}`}>
                {msg.text}
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={saving}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-700 text-gray-900 font-semibold px-6 py-2 rounded-lg transition text-sm">
                {saving ? "Creando…" : "Crear usuario"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
