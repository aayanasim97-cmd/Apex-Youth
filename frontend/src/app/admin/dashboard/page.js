"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api-client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  Shield, BarChart3, Database, Calendar, AlertTriangle, 
  CheckCircle, RefreshCw, Server, AlertCircle 
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [fetchingStats, setFetchingStats] = useState(true);
  const [error, setError] = useState(null);
  
  // Temporarily bypass guard verification by setting loading to false by default
  const [guardLoading, setGuardLoading] = useState(false);

  /* TEMPORARILY DISABLED FOR INSPECTION
  // 1. Strict Safety Render: 3-second hard timeout safety breakout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (guardLoading) {
        console.warn("[Admin Guard] Safety timeout exceeded. Evaluating fallback redirect.");
        if (!user || (!user.is_staff && !user.is_superuser)) {
          router.replace("/");
        } else {
          setGuardLoading(false);
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [guardLoading, user, router]);

  // 2. Active Claim Evaluation & Direct Short-Circuit Fallback
  useEffect(() => {
    const validateAccess = async () => {
      if (!authLoading && !user) {
        try {
          const res = await apiFetch("/api/auth/profile/");
          if (res.ok) {
            const data = await res.json();
            if (data.is_staff || data.is_superuser) {
              setGuardLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error("[Admin Guard] Direct validation check failed", e);
        }
        router.replace("/");
      } else if (!authLoading && user) {
        if (user.is_staff || user.is_superuser) {
          setGuardLoading(false);
        } else {
          router.replace("/");
        }
      }
    };

    validateAccess();
  }, [user, authLoading, router]);
  */

  // Fetch admin analytics
  const fetchAnalytics = async () => {
    setFetchingStats(true);
    setError(null);
    try {
      const res = await apiFetch("/api/admin/analytics/");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        // Fallback to mock stats for inspection when API returns 403/401
        console.warn("[Admin Dashboard] API returned status:", res.status, ". Falling back to mock data for UI inspection.");
        loadMockData("Authorization Layer is active. Showing simulated metrics for UI layout preview.");
      }
    } catch (err) {
      console.warn("[Admin Dashboard] API error:", err, ". Falling back to mock data for UI inspection.");
      loadMockData("Backend unreachable. Showing simulated metrics for UI layout preview.");
    } finally {
      setFetchingStats(false);
    }
  };

  const loadMockData = (warningMessage) => {
    setError(warningMessage);
    setStats({
      total_opportunities: 29,
      active_opportunities: 18,
      expired_purged_count: 11,
      latest_logs: [
        { 
          id: 105, 
          status: "created", 
          created_at: new Date(Date.now() - 3600000).toISOString(), 
          opportunity_title: "British Council Travel Grant Fund 2", 
          errors: null 
        },
        { 
          id: 104, 
          status: "updated", 
          created_at: new Date(Date.now() - 7200000).toISOString(), 
          opportunity_title: "RAEng Africa Prize for Engineering", 
          errors: null 
        },
        { 
          id: 103, 
          status: "rejected", 
          created_at: new Date(Date.now() - 14400000).toISOString(), 
          opportunity_title: "Gulbenkian Advanced Studies", 
          errors: { "title": ["This field must be unique."] } 
        },
        { 
          id: 102, 
          status: "created", 
          created_at: new Date(Date.now() - 86400000).toISOString(), 
          opportunity_title: "Innocent Chukwuemeka Fellowship", 
          errors: null 
        }
      ]
    });
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (guardLoading) {
    return (
      <div className="min-h-screen bg-abyss flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-signal animate-spin" />
          <p className="text-sm font-mono text-mist">Authenticating Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-abyss flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-custom/30 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-signal" />
              <span className="text-xs font-mono font-semibold tracking-wider text-signal uppercase">
                Staff Control Center (INSPECTION MODE)
              </span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white">
              Admin & Analytics Board
            </h1>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={fetchingStats}
            className="flex items-center gap-2 px-4 py-2 bg-slate-raised hover:bg-slate-surface text-sm font-mono font-semibold text-white rounded-lg border border-border-custom transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${fetchingStats ? "animate-spin" : ""}`} />
            REFRESH METRICS
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 mb-8">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-mono">{error}</p>
          </div>
        )}

        {fetchingStats || !stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-surface rounded-xl border border-border-custom p-6 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <>
            {/* Analytics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Stat 1: Total Opportunities */}
              <div className="bg-slate-surface rounded-xl border border-border-custom p-6 shadow-sm">
                <span className="text-[10px] font-mono text-mist uppercase tracking-wider block mb-1">
                  Total Crawled Opportunities
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-bold text-white">
                    {stats.total_opportunities}
                  </span>
                  <Database className="h-4 w-4 text-blue-500" />
                </div>
              </div>

              {/* Stat 2: Active Opportunities */}
              <div className="bg-slate-surface rounded-xl border border-border-custom p-6 shadow-sm">
                <span className="text-[10px] font-mono text-mist uppercase tracking-wider block mb-1">
                  Active Feed Listings
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-bold text-white">
                    {stats.active_opportunities}
                  </span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
              </div>

              {/* Stat 3: Expired/Purged count */}
              <div className="bg-slate-surface rounded-xl border border-border-custom p-6 shadow-sm">
                <span className="text-[10px] font-mono text-mist uppercase tracking-wider block mb-1">
                  Expired / Purged Count
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-bold text-white">
                    {stats.expired_purged_count}
                  </span>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
              </div>

              {/* Stat 4: Scheduled Sync */}
              <div className="bg-slate-surface rounded-xl border border-border-custom p-6 shadow-sm">
                <span className="text-[10px] font-mono text-mist uppercase tracking-wider block mb-1">
                  Next Scheduled Crawler Sync
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-mono font-bold text-white">
                    Daily at 3:00 AM
                  </span>
                  <Calendar className="h-4 w-4 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Pipeline Logs Audit Table */}
            <div className="bg-slate-surface rounded-xl border border-border-custom p-6 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <Server className="h-5 w-5 text-signal" />
                <h3 className="font-display font-bold text-lg text-white">
                  n8n Ingestion Pipeline Run Logs
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border-custom/50 font-mono text-xs text-mist">
                      <th className="pb-3 font-semibold">LOG ID</th>
                      <th className="pb-3 font-semibold">TIMESTAMP</th>
                      <th className="pb-3 font-semibold">STATUS</th>
                      <th className="pb-3 font-semibold">OPPORTUNITY</th>
                      <th className="pb-3 font-semibold">ERRORS / VALIDATION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom/30">
                    {stats.latest_logs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-mist font-mono text-xs">
                          No ingestion runs logged yet.
                        </td>
                      </tr>
                    ) : (
                      stats.latest_logs.map((log) => {
                        const statusStyles = {
                          created: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                          updated: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                          rejected: "text-rose-400 bg-rose-500/10 border-rose-500/20",
                        }[log.status] || "text-gray-400 bg-gray-500/10";

                        return (
                          <tr key={log.id} className="hover:bg-slate-raised/30 transition-colors">
                            <td className="py-3.5 font-mono text-xs text-white">#{log.id}</td>
                            <td className="py-3.5 text-mist font-mono text-xs">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase ${statusStyles}`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-white max-w-xs truncate font-medium">
                              {log.opportunity_title || "N/A"}
                            </td>
                            <td className="py-3.5 text-rose-400 font-mono text-xs max-w-sm truncate">
                              {log.errors ? JSON.stringify(log.errors) : "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
