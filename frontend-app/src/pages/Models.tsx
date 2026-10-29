import { useEffect, useState, useMemo } from "react";
import {
  Server,
  Layers,
  Sparkles,
  RefreshCw,
  Cpu,
  Clock,
  type LucideIcon,
} from "lucide-react";
import api, { getApiErrorMessage } from "../services/api";
import type { ModelRecord } from "../types/api";
import { QualityTierBadge, ProviderBadge } from "../components/StatusBadge";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";

interface ProviderStats {
  name: string;
  count: number;
  enabledCount: number;
  minInputCost: number;
  maxOutputCost: number;
  avgLatency: number;
  tiers: Set<number>;
}

export function Models() {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchModels = async () => {
    try {
      const response = await api.get<ModelRecord[]>("/models");
      setError("");
      setModels(response.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to load model data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchModels();
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    void fetchModels();
  };

  useEffect(() => {
    queueMicrotask(() => void fetchModels());
  }, []);

  // Compute dynamic provider aggregations
  const providerStats = useMemo(() => {
    const map = new Map<string, ProviderStats>();

    models.forEach((model) => {
      const p = model.provider.toLowerCase();
      if (!map.has(p)) {
        map.set(p, {
          name: model.provider,
          count: 0,
          enabledCount: 0,
          minInputCost: model.input_cost_per_1k_tokens,
          maxOutputCost: model.output_cost_per_1k_tokens,
          avgLatency: 0,
          tiers: new Set<number>(),
        });
      }

      const stat = map.get(p)!;
      stat.count++;
      if (model.enabled) stat.enabledCount++;
      stat.minInputCost = Math.min(stat.minInputCost, model.input_cost_per_1k_tokens);
      stat.maxOutputCost = Math.max(stat.maxOutputCost, model.output_cost_per_1k_tokens);
      stat.avgLatency += model.average_latency_ms;
      stat.tiers.add(model.quality_tier);
    });

    // Compute average latencies
    map.forEach((stat) => {
      if (stat.count > 0) {
        stat.avgLatency = stat.avgLatency / stat.count;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [models]);

  const getProviderIcon = (provider: string): LucideIcon => {
    const p = provider.toLowerCase();
    if (p.includes("ollama")) return Cpu;
    if (p.includes("gemini")) return Sparkles;
    if (p.includes("claude")) return Layers;
    return Server;
  };

  return (
    <div className="space-y-6">
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

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={handleRetry} />}

      {/* Loading state */}
      {loading && <LoadingState message="Loading model catalog..." rows={4} />}

      {/* Empty State */}
      {!loading && !error && models.length === 0 && (
        <EmptyState
          title="No models configured"
          description="No models or providers are currently registered in Oracto."
        />
      )}

      {!loading && !error && models.length > 0 && (
        <>
          {/* Provider Overview Cards */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Available Providers ({providerStats.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providerStats.map((provider) => {
                const Icon = getProviderIcon(provider.name);
                const isFullyAvailable = provider.enabledCount === provider.count;
                const isPartiallyAvailable =
                  provider.enabledCount > 0 && provider.enabledCount < provider.count;

                return (
                  <div
                    key={provider.name}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-indigo-600 shadow-2xs">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold capitalize text-slate-900">
                            {provider.name}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {provider.count} {provider.count === 1 ? "Model" : "Models"}
                          </p>
                        </div>
                      </div>

                      {/* Status indicator */}
                      {isFullyAvailable ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Enabled
                        </span>
                      ) : isPartiallyAvailable ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {provider.enabledCount}/{provider.count} Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Disabled
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">
                          Avg Latency
                        </span>
                        <div className="mt-0.5 flex items-center gap-1 font-medium text-slate-700">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>
                            {provider.avgLatency >= 1000
                              ? `${(provider.avgLatency / 1000).toFixed(1)} s`
                              : `${provider.avgLatency.toFixed(0)} ms`}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">
                          Tiers Served
                        </span>
                        <div className="mt-0.5 flex items-center gap-1">
                          {Array.from(provider.tiers)
                            .sort()
                            .map((t) => (
                              <QualityTierBadge key={t} tier={t} />
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Catalog Table */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Configured Models ({models.length})
            </h2>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3.5">Provider</th>
                      <th className="px-4 py-3.5">Model</th>
                      <th className="px-4 py-3.5">Quality Tier</th>
                      <th className="px-4 py-3.5">Input Cost / 1K</th>
                      <th className="px-4 py-3.5">Output Cost / 1K</th>
                      <th className="px-4 py-3.5">Average Latency</th>
                      <th className="px-4 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {models.map((model) => {
                      const avgSec = (model.average_latency_ms / 1000).toFixed(1);

                      return (
                        <tr
                          key={`${model.provider}-${model.model_id}`}
                          className="hover:bg-slate-50/60 transition"
                        >
                          {/* Provider */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <ProviderBadge provider={model.provider} />
                          </td>

                          {/* Model ID */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-slate-900 bg-slate-100/80 px-2 py-1 rounded text-xs">
                                {model.model_id}
                              </span>
                              {model.provider === "claude" && model.model_id === "claude-sonnet-4-6" && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  Benchmark
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Quality Tier */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <QualityTierBadge tier={model.quality_tier} />
                          </td>

                          {/* Input Cost */}
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-700">
                            ${model.input_cost_per_1k_tokens.toFixed(6)}
                          </td>

                          {/* Output Cost */}
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-700">
                            ${model.output_cost_per_1k_tokens.toFixed(6)}
                          </td>

                          {/* Latency */}
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                            <span className="font-medium text-slate-800">
                              {model.average_latency_ms < 1000
                                ? `${model.average_latency_ms.toFixed(0)} ms`
                                : `${avgSec} s`}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {model.enabled ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                Disabled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
