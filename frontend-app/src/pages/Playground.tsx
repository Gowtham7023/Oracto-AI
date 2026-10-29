import { useState } from "react";
import {
  ArrowDown,
  ChevronDown,
  Gauge,
  LoaderCircle,
  Sliders,
  Wand2,
} from "lucide-react";
import api, { getApiErrorMessage } from "../services/api";
import type { CompletionRequest, CompletionResponse } from "../types/api";

export function Playground() {
  const [prompt, setPrompt] = useState("");
  const [generationMode, setGenerationMode] = useState<"automatic" | "manual">("automatic");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [result, setResult] = useState<CompletionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runPrompt = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload: CompletionRequest = {
        prompt,
        generation_mode: generationMode,
        ...(generationMode === "manual"
          ? { temperature, max_tokens: maxTokens }
          : {}),
      };

      const response = await api.post<CompletionResponse>("/completions", payload);
      setResult(response.data);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "Unable to process the prompt."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label htmlFor="playground-prompt" className="text-sm font-medium text-slate-700">
              Your prompt
            </label>
            <textarea
              id="playground-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="mt-3 min-h-52 w-full rounded-xl border border-slate-200 bg-white p-4 text-base text-slate-900 outline-none transition focus:border-indigo-500"
              placeholder="Describe the task you want Oracto to route..."
            />

            {/* Generation Settings Status Card */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Generation Settings</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                  {generationMode === "automatic" ? "Automatic" : "Manual"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {generationMode === "automatic"
                  ? "Oracto automatically selects generation settings based on request complexity."
                  : "Manual overrides enabled for temperature and max tokens."}
              </p>
            </div>

            {/* Collapsible Advanced Settings */}
            <div className="mt-3">
              <button
                type="button"
                id="advanced-settings-toggle"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100/80"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-slate-500" />
                  Advanced Settings
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    showAdvanced ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showAdvanced && (
                <div
                  id="advanced-settings-panel"
                  className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Generation Mode
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id="btn-mode-automatic"
                        onClick={() => setGenerationMode("automatic")}
                        className={`rounded-lg py-2 text-xs font-medium transition ${
                          generationMode === "automatic"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Automatic
                      </button>
                      <button
                        type="button"
                        id="btn-mode-manual"
                        onClick={() => setGenerationMode("manual")}
                        className={`rounded-lg py-2 text-xs font-medium transition ${
                          generationMode === "manual"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>

                  {generationMode === "automatic" ? (
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900">
                      <p className="font-medium">Automatic Settings Active</p>
                      <p className="mt-1 text-slate-600">
                        Oracto automatically optimizes generation settings based on request complexity.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 pt-1 md:grid-cols-2">
                      <label className="block rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium">Temperature</span>
                          <span className="font-semibold text-slate-900">{temperature.toFixed(2)}</span>
                        </div>
                        <input
                          id="input-temperature"
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={temperature}
                          onChange={(event) => setTemperature(Number(event.target.value))}
                          className="w-full cursor-pointer accent-indigo-600"
                        />
                      </label>

                      <label className="block rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium">Max tokens</span>
                          <span className="font-semibold text-slate-900">{maxTokens}</span>
                        </div>
                        <input
                          id="input-max-tokens"
                          type="number"
                          min="128"
                          max="16384"
                          step="128"
                          value={maxTokens}
                          onChange={(event) => setMaxTokens(Number(event.target.value) || 0)}
                          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              id="run-with-oracto-btn"
              onClick={runPrompt}
              disabled={loading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Run with Oracto
                </>
              )}
            </button>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Response</h3>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                <Gauge className="h-3.5 w-3.5" />
                Live
              </div>
            </div>

            <div className="mt-4 min-h-[300px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {result ? (
                <div className="whitespace-pre-wrap">{result.output || "The provider returned an empty response."}</div>
              ) : (
                <div className="flex h-full items-center justify-center text-center text-slate-400">
                  Awaiting a routed response from Oracto.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Complexity", value: result.complexity, detail: `Confidence ${(result.confidence * 100).toFixed(1)}%` },
                { label: "Selected model", value: result.model, detail: `Provider: ${result.provider}` },
                { label: "Actual cost", value: `$${result.actual_cost.toFixed(6)}`, detail: `Latency: ${result.latency_ms} ms` },
                { label: "Quality", value: result.quality_score !== null ? `${(result.quality_score * 100).toFixed(1)}%` : "Pending", detail: result.verification_status },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-xl font-semibold capitalize text-slate-900">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Generation Settings Response Panel */}
          {result.generation_settings && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Generation Settings</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-700">
                  Mode: {result.generation_settings.mode}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Mode</p>
                  <p className="mt-2 text-xl font-semibold capitalize text-slate-900">{result.generation_settings.mode}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {result.generation_settings.mode === "automatic"
                      ? "Complexity-optimized"
                      : "User override"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Complexity</p>
                  <p className="mt-2 text-xl font-semibold capitalize text-slate-900">{result.complexity}</p>
                  <p className="mt-1 text-xs text-slate-500">Classification tier {result.required_tier}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Temperature</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {result.generation_settings.temperature.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Sampling randomness</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Max Tokens</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{result.generation_settings.max_tokens}</p>
                  <p className="mt-1 text-xs text-slate-500">Response token ceiling</p>
                </div>
              </div>
            </div>
          )}

          {/* Execution Trace */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Execution trace</h3>
            <div className="mt-6">
              {[
                { step: "1", label: "Prompt", detail: prompt.trim() || "Request captured" },
                { step: "2", label: "Complexity Analysis", detail: `${result.complexity.toUpperCase()} • ${(result.confidence * 100).toFixed(1)}% confidence` },
                {
                  step: "3",
                  label: "Automatic Generation Settings",
                  detail: `${result.generation_settings?.mode === "automatic" ? "Automatic" : "Manual"} • Temp: ${result.generation_settings?.temperature?.toFixed(2)} • Max tokens: ${result.generation_settings?.max_tokens}`,
                },
                { step: "4", label: "Intelligent Model Routing", detail: `${result.provider} • ${result.model} • Tier ${result.quality_tier}` },
                { step: "5", label: "LLM Generation", detail: `${result.output.length} chars • ${result.latency_ms} ms • $${result.actual_cost.toFixed(6)}` },
                { step: "6", label: "Quality Verification", detail: `${((result.quality_score ?? 0) * 100).toFixed(1)}% • ${result.verification_status}` },
                { step: "7", label: "Escalation", detail: result.escalated ? "Escalated" : "Not escalated" },
              ].map((entry, index) => (
                <div key={entry.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                      {entry.step}
                    </div>
                    {index < 6 && <ArrowDown className="my-2 h-4 w-4 text-slate-300" />}
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                    <p className="mt-1 text-sm text-slate-600">{entry.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Dimensions */}
          {result.quality && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Quality dimensions</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Object.entries(result.quality.dimensions).map(([dimension, score]) => (
                  <div key={dimension} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      {dimension.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {(score * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
