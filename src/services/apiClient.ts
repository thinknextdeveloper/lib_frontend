import { getStorage, removeStorage, setStorage } from "@/utils/storage";

export interface ApiResult<T = any> {
  success: boolean;
  data: T | null;
  error: { message: string } | null;
}

const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/";
  const clean = envUrl.replace(/['"]+/g, "").trim();
  return clean.endsWith("/") ? clean : `${clean}/`;
};

const buildFullUrl = (url: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanPath = url.startsWith("/") ? url.slice(1) : url;
  return `${baseUrl}${cleanPath}`;
};

const handleResponse = async (response: Response): Promise<ApiResult> => {
  const rawText = await response.text();

  let data;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    if (rawText.trim().startsWith("<!DOCTYPE") || rawText.trim().startsWith("<html")) {
      throw new Error(
        `Server returned HTML instead of JSON (${response.status} ${response.statusText}). Please check backend API server running.`
      );
    }
    throw new Error("Failed to parse JSON response.");
  }

  return {
    success: response.ok,
    data: response.ok ? data : null,
    error: !response.ok
      ? {
          message:
            data?.message ||
            data?.error?.message ||
            `HTTP ${response.status}: Something went wrong`,
        }
      : null,
  };
};

const refreshAccessToken = async () => {
  if (typeof window === "undefined") return null;

  const refreshToken = getStorage("refreshToken");

  if (!refreshToken) return null;

  try {
    const res = await fetch(buildFullUrl("user/refresh-token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const json = await res.json();

    if (res.ok && json?.data?.accessToken) {
      setStorage("token", json.data.accessToken);
      return json.data.accessToken as string;
    }

    removeStorage("token");
    removeStorage("refreshToken");
    removeStorage("user");
    return null;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
};

export const reduxApiClient = {
  request: async (
    method: string,
    url: string,
    body?: any,
    includeToken = true,
    isFileUpload = false
  ): Promise<ApiResult> => {
    const token = getStorage("token");

    const headers: Record<string, string> = {};

    if (includeToken && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (!isFileUpload) {
      headers["Content-Type"] = "application/json";
    }

    const options: RequestInit = {
      method,
      headers,
      ...(body
        ? {
            body: isFileUpload ? body : JSON.stringify(body),
          }
        : {}),
    };

    const fullUrl = buildFullUrl(url);
    let response = await fetch(fullUrl, options);

    if (response.status === 401 && includeToken) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        (options.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;

        response = await fetch(fullUrl, options);
      }
    }

    return handleResponse(response);
  },

  get: (url: string, params?: Record<string, string>, includeToken = true) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";

    return reduxApiClient.request("GET", `${url}${query}`, undefined, includeToken);
  },

  post: (url: string, body?: any, includeToken = true) =>
    reduxApiClient.request("POST", url, body, includeToken),

  put: (url: string, body?: any, includeToken = true) =>
    reduxApiClient.request("PUT", url, body, includeToken),

  patch: (url: string, body?: any, includeToken = true) =>
    reduxApiClient.request("PATCH", url, body, includeToken),

  delete: (url: string, includeToken = true) =>
    reduxApiClient.request("DELETE", url, undefined, includeToken),

  postFile: (url: string, formData: FormData) =>
    reduxApiClient.request("POST", url, formData, true, true),
};