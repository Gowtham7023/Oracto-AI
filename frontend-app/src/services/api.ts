import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ??
    "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!axios.isAxiosError<{ detail?: unknown }>(error)) {
    return fallback;
  }

  const detail = error.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const firstError = detail[0];
    if (
      typeof firstError === "object" &&
      firstError !== null &&
      "msg" in firstError &&
      typeof firstError.msg === "string"
    ) {
      return firstError.msg;
    }
  }

  if (
    typeof detail === "object" &&
    detail !== null &&
    "message" in detail &&
    typeof detail.message === "string"
  ) {
    return detail.message;
  }

  return fallback;
}

export default api;
