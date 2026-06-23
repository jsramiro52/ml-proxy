import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Error al iniciar sesión"); return; }
      router.push("/");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📊</div>
          <h1 className="text-2xl font-bold text-white">Dashboard ML</h1>
          <p className="text-gray-400 text-sm mt-1">Coeficiente Publicidad</p>
        </div>

        <form onSubmit={handle} className="bg-gray-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Usuario</label>
            <input
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-gray-600"
              placeholder="tu_usuario"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-gray-600"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-500/50 text-red-300 rounded-lg px-4 py-2.5 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-700 text-gray-900 font-semibold py-2.5 rounded-lg transition text-sm"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">Lobo Negro MX © 2026</p>
      </div>
    </div>
  );
}
