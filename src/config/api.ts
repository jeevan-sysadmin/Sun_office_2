const normalizeApiBaseUrl = (value?: string): string => {
  const rawValue = value?.trim();
  if (!rawValue) {
    return "";
  }

  return rawValue.replace(/\/+$/, "");
};

const buildDefaultApiBaseUrl = (): string => {
  const localhostApi = "http://localhost:5000/api";

  if (typeof window === "undefined") {
    return localhostApi;
  }

  try {
    const hostname = window.location.hostname.trim().toLowerCase();
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      /^127(?:\.\d{1,3}){3}$/.test(hostname) ||
      /^10(?:\.\d{1,3}){3}$/.test(hostname) ||
      /^192\.168(?:\.\d{1,3}){2}$/.test(hostname) ||
      (() => {
        const match = hostname.match(/^172\.(\d{1,3})(?:\.\d{1,3}){2}$/);
        if (!match) return false;
        const secondOctet = Number(match[1]);
        return secondOctet >= 16 && secondOctet <= 31;
      })();

    return isLocalhost ? `${window.location.origin}/api` : localhostApi;
  } catch {
    return localhostApi;
  }
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
