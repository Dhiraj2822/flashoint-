// Global API configuration
const API_BASE_URL = (() => {
  const fromStorage = window.localStorage.getItem("dpi_api_base_url");
  const fromGlobal = window.DPI_API_BASE_URL;
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const fallback = isLocal
    ? "http://localhost:8000"
    : "https://development-priority-intelligence.onrender.com";

  const raw = (fromStorage || fromGlobal || fallback).trim();
  return raw.replace(/\/+$/, "");
})();
