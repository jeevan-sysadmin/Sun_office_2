const normalizeApiBaseUrl = (value?: string): string => {
  const rawValue = value?.trim();
  if (!rawValue) {
    return "";
  }

  return rawValue.replace(/\/+$/, "");
};

const buildDefaultApiBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return "http://localhost:5000/api";
  }

  return `${window.location.origin}/api`;
};

const fallbackApiBaseUrl =
  buildDefaultApiBaseUrl();

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl
);

export const buildApiUrl = (path: string): string =>
  `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;

export const WATER_SERVICES_URL = buildApiUrl("water_services.php");
export const LOGIN_URL = buildApiUrl("login.php");
