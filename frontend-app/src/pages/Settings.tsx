import { useEffect, useState } from "react";
import {
  Sparkles,
  Route,
  ShieldCheck,
  Server,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import api, { getApiErrorMessage } from "../services/api";
import type { RoutingConfig, HealthResponse } from "../types/api";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { Link } from "react-router-dom";

export function Settings() {
  const [config, setConfig] = useState<RoutingConfig | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>("Checking...");
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchSettingsData = async () => {
    try {
      const [configRes, healthRes] = await Promise.allSettled([
        api.get<RoutingConfig>("/routing-config"),
        axios.get<HealthResponse>("http://127.0.0.1:8000/health"),
      ]);

      setError("");
      if (configRes.status === "fulfilled") {
        setConfig(configRes.value.data);
      }

      if (healthRes.status === "fulfilled") {
        setHealthStatus(healthRes.value.data.status);
        setHealthOk(healthRes.value.data.status === "healthy");
      } else {
        setHealthStatus("Disconnected");
        setHealthOk(false);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to load settings data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchSettingsData();
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    void fetchSettingsData();
  };

  useEffect(() => {
    queueMicrotask(() => void fetchSettingsData());
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin text-indigo-600" : ""}`}
          />
          Refresh
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={handleRetry} />}

      {loading && <LoadingState message="Loading settings..." rows={3} />}

      {!loading && (
        <div className="space-y-6">
          {/* SECTION 1: GENERAL */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  General Platform
                </h2>
                <p className="text-xs text-slate-500">
                  Platform identity, architecture, and engine version.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-slate-100 pt-4 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-slate-400 block text-[11px]">Product</span>
                <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                  ORACTO
                </span>
                <span className="text-slate-500 text-[11px]">AI Cost Autopilot</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-slate-400 block text-[11px]">Version</span>
                <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                  1.0.0
                </span>
                <span className="text-slate-500 text-[11px]">Production Stable</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-slate-400 block text-[11px]">Architecture</span>
                <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                  Multi-LLM Hybrid
                </span>
                <span className="text-slate-500 text-[11px]">
                  Classifier + Cost Router + Judge
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: ROUTING CONFIGURATION */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Route className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Routing Engine Parameters
                  </h2>
                  <p className="text-xs text-slate-500">
                    Current active minimum quality tiers configured in the router.
                  </p>
                </div>
              </div>
              <Link
                to="/routing"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
              >
                <span>Edit in Routing</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            {config ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-slate-100 pt-4 text-xs">
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                  <span className="text-slate-400 block text-[11px]">
                    Simple Minimum Tier
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      Tier {config.simple_min_tier}
                    </span>
                    <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 font-semibold">
                      Local / Fast
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                  <span className="text-slate-400 block text-[11px]">
                    Moderate Minimum Tier
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      Tier {config.moderate_min_tier}
                    </span>
                    <span className="rounded bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 font-semibold">
                      Balanced
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                  <span className="text-slate-400 block text-[11px]">
                    Complex Minimum Tier
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      Tier {config.complex_min_tier}
                    </span>
                    <span className="rounded bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 font-semibold">
                      Frontier
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">
                Routing configuration is currently unavailable.
              </p>
            )}
          </div>

          {/* SECTION 3: QUALITY & ESCALATION */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Quality Verification & Escalation
                </h2>
                <p className="text-xs text-slate-500">
                  Verification criteria and automatic failover conditions.
                </p>
              </div>
            </div>

            {config ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-slate-100 pt-4 text-xs">
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                  <span className="text-slate-400 block text-[11px]">
                    Quality Score Threshold
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-900">
                      {(config.quality_threshold * 100).toFixed(0)}%
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Minimum acceptable quality score
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                  <span className="text-slate-400 block text-[11px]">
                    Automatic Escalation
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    {config.enable_escalation ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Disabled
                      </span>
                    )}
                    <span className="text-slate-500 text-[11px]">
                      Re-routes to Tier 3 on verification failure
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">
                Quality configuration is currently unavailable.
              </p>
            )}
          </div>

          {/* SECTION 4: API & INTEGRATION */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Backend API Connection
                </h2>
                <p className="text-xs text-slate-500">
                  Live connection health status. Keys and secrets are secure in environment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-slate-100 pt-4 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-slate-400 block text-[11px]">
                  Connection Status
                </span>
                <div className="mt-1 flex items-center gap-2">
                  {healthOk ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Connected ({healthStatus})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 font-semibold text-rose-700">
                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                      {healthStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-slate-400 block text-[11px]">
                  API Framework
                </span>
                <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                  FastAPI (Python)
                </span>
                <span className="text-slate-500 text-[11px]">REST Endpoints v1</span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-slate-400 block text-[11px]">
                  Credentials & Secrets
                </span>
                <span className="font-semibold text-emerald-700 text-sm mt-0.5 block flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Protected
                </span>
                <span className="text-slate-500 text-[11px]">
                  Server-side environment variables
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
