import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const MXN = (v) =>
  Number(v).toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 });

const PCT = (v) => `${(Number(v) * 100).toFixed(2)}%`;

function StatCard({ label, value, sub, color = "text-white" }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-5 flex flex-col gap-1">
      <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-gray-400 text-xs">{sub}</span>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm shadow-xl">
      <p className="text-gray-300 font-semibold mb-1">{label}</p>
      <p className="text-yellow-400">Coeficiente: {PCT(d.coeficiente_publicidad)}</p>
      <p className="text-blue-400">Inversión+IVA: {MXN(d.inversion_publicidad_iva)}</p>
      <p className="text-green-400">Ventas: {MXN(d.ventas_totales_momento)}</p>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [loadingMetricas, setLoadingMetricas] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(u => setMe(u));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/data");
      if (!r.ok) throw new Error("Error al cargar datos");
      const json = await r.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/metricas')
      .then(r => r.json())
      .then(d => { setMetricas(d); setLoadingMetricas(false); })
      .catch(() => setLoadingMetricas(false));
  }, []);

  if (loading && !data)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-lg animate-pulse">Cargando datos…</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    );

  const rows = data?.data || [];

  const today = rows.filter((r) => r.fecha === rows[rows.length - 1]?.fecha);
  const yesterday = rows.filter((r) => {
    if (!today.length) return false;
    const d = new Date(today[0].fecha);
    d.setDate(d.getDate() - 1);
    return r.fecha === d.toISOString().slice(0, 10);
  });

  const latest = today[today.length - 1] || {};
  const latestYest = yesterday[yesterday.length - 1] || {};

  const coefPct = Number(latest.coeficiente_publicidad || 0);
  const coefYest = Number(latestYest.coeficiente_publicidad || 0);
  const coefDelta = coefYest > 0 ? ((coefPct - coefYest) / coefYest) * 100 : 0;

  const coefColor =
    coefPct < 0.035 ? "text-green-400" : coefPct < 0.045 ? "text-yellow-400" : "text-red-400";

  const chartData = today.map((r) => ({
    ...r,
    hora: r.hora,
    coef_pct: Number((r.coeficiente_publicidad * 100).toFixed(2)),
  }));

  const dias = [...new Set(rows.map((r) => r.fecha))].sort().slice(-7);
  const dailySummary = dias.map((fecha) => {
    const dayRows = rows.filter((r) => r.fecha === fecha);
    const last = dayRows[dayRows.length - 1];
    return {
      fecha,
      dia: last?.dia_semana || "",
      coef: last ? PCT(last.coeficiente_publicidad) : "—",
      inversion: last ? MXN(last.inversion_publicidad_iva) : "—",
      ventas: last ? MXN(last.ventas_totales_momento) : "—",
    };
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white">📊 Coeficiente Publicidad</h1>
            <p className="text-gray-400 text-sm capitalize">
              {latest.dia_semana} {latest.fecha}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {lastRefresh && (
              <span className="text-gray-500 text-xs">
                Actualizado {lastRefresh.toLocaleTimeString("es-MX")}
              </span>
            )}
            {me && (
              <span className="text-gray-400 text-xs bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg">
                {me.name}
              </span>
            )}
            <button onClick={load} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition">
              Actualizar
            </button>
            {me?.role === "admin" && (
              <Link href="/admin" className="bg-yellow-600 hover:bg-yellow-500 text-white text-sm px-4 py-2 rounded-lg transition">
                ⚙️ Usuarios
              </Link>
            )}
            <button onClick={logout} className="bg-gray-700 hover:bg-red-800 text-gray-300 hover:text-red-200 text-sm px-4 py-2 rounded-lg transition">
              Salir
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Coeficiente Actual"
            value={PCT(latest.coeficiente_publicidad)}
            sub={`Ayer cierre: ${PCT(latestYest.coeficiente_publicidad)} (${coefDelta >= 0 ? "+" : ""}${coefDelta.toFixed(1)}%)`}
            color={coefColor}
          />
          <StatCard
            label="Inversión + IVA"
            value={MXN(latest.inversion_publicidad_iva)}
            sub="Acumulado hoy"
            color="text-blue-400"
          />
          <StatCard
            label="Ventas del Día"
            value={MXN(latest.ventas_totales_momento)}
            sub={`Ayer: ${MXN(latestYest.ventas_totales_momento)}`}
            color="text-green-400"
          />
          <StatCard
            label="Registros Hoy"
            value={today.length}
            sub={`Total histórico: ${rows.length}`}
          />
        </div>

        {/* Chart */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-gray-300 font-semibold mb-4 text-sm uppercase tracking-wide">
            Coeficiente por hora — hoy
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hora" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={3.5} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Meta 3.5%", fill: "#22c55e", fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="coef_pct"
                stroke="#facc15"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#facc15" }}
                activeDot={{ r: 5 }}
                name="Coeficiente %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Daily summary table */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-gray-300 font-semibold mb-4 text-sm uppercase tracking-wide">
            Resumen últimos 7 días (cierre)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-4 font-medium">Fecha</th>
                  <th className="text-left py-2 pr-4 font-medium">Día</th>
                  <th className="text-right py-2 pr-4 font-medium">Ventas</th>
                  <th className="text-right py-2 pr-4 font-medium">Inversión</th>
                  <th className="text-right py-2 font-medium">Coeficiente</th>
                </tr>
              </thead>
              <tbody>
                {dailySummary.reverse().map((d, i) => (
                  <tr
                    key={d.fecha}
                    className={`border-b border-gray-700/50 ${i === 0 ? "bg-gray-700/30" : ""}`}
                  >
                    <td className="py-2 pr-4 text-gray-300">{d.fecha}</td>
                    <td className="py-2 pr-4 text-gray-400 capitalize">{d.dia}</td>
                    <td className="py-2 pr-4 text-right text-green-400">{d.ventas}</td>
                    <td className="py-2 pr-4 text-right text-blue-400">{d.inversion}</td>
                    <td className={`py-2 text-right font-semibold ${
                      parseFloat(d.coef) < 3.5 ? "text-green-400" :
                      parseFloat(d.coef) < 4.5 ? "text-yellow-400" : "text-red-400"
                    }`}>{d.coef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Ventas ML 7 días */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-gray-300 font-semibold mb-4 text-sm uppercase tracking-wide">
            Ventas Mercado Libre — Últimos 7 días
          </h2>
          {loadingMetricas ? (
            <div className="text-gray-500 text-sm animate-pulse">Cargando datos de ventas…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 pr-4 font-medium">Fecha</th>
                    <th className="text-right py-2 pr-4 font-medium">Órdenes</th>
                    <th className="text-right py-2 pr-4 font-medium">Unidades</th>
                    <th className="text-right py-2 pr-4 font-medium">Venta Total</th>
                    <th className="text-right py-2 pr-4 font-medium">Visitas</th>
                    <th className="text-right py-2 font-medium">Conversión</th>
                  </tr>
                </thead>
                <tbody>
                  {(metricas?.dias || []).map((d, i) => (
                    <tr key={d.fecha} className={`border-b border-gray-700/50 ${i === 0 ? 'bg-gray-700/30' : ''}`}>
                      <td className="py-2 pr-4 text-gray-300">{d.fecha}</td>
                      <td className="py-2 pr-4 text-right text-white">{d.ordenes}</td>
                      <td className="py-2 pr-4 text-right text-white">{d.unidades}</td>
                      <td className="py-2 pr-4 text-right text-green-400">{MXN(d.ventas_total)}</td>
                      <td className="py-2 pr-4 text-right text-blue-400">{d.visitas.toLocaleString()}</td>
                      <td className={`py-2 text-right font-semibold ${
                        d.conversion_pct >= 5 ? 'text-green-400' :
                        d.conversion_pct >= 2 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>{d.conversion_pct}%</td>
                    </tr>
                  ))}
                  {(!metricas?.dias?.length) && (
                    <tr><td colSpan={6} className="py-4 text-center text-gray-500">Sin datos disponibles</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs">
          Datos actualizados cada hora • Lobo Negro MX
        </p>
      </div>
    </div>
  );
}
