import React, { useEffect, useState } from "react";
import { FiDownload, FiDatabase, FiClock, FiRefreshCw } from "react-icons/fi";

interface BackupRecord {
  id: string;
  file_name: string;
  created_at: string;
  size?: number | string;
}

interface BackupTabProps {
  apiBaseUrl: string;
  showSnackbar?: (message: string, severity: "success" | "error") => void;
}

const LOCAL_BACKUP_KEY = "sun_office_backup_history";
const DEFAULT_BACKUP_FILE_NAME = "sun_office.sql";

const BackupTab: React.FC<BackupTabProps> = ({ apiBaseUrl, showSnackbar }) => {
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);
  const [resolvedBackupBase, setResolvedBackupBase] = useState<string>(apiBaseUrl);

  const readLocalHistory = (): BackupRecord[] => {
    try {
      const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const persistLocalHistory = (records: BackupRecord[]) => {
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(records));
  };

  const mergeAndSetHistory = (serverHistory: BackupRecord[]) => {
    const normalizedServer = Array.isArray(serverHistory) ? serverHistory : [];
    const mergedMap = new Map<string, BackupRecord>();
    const localHistory = readLocalHistory();
    [...normalizedServer, ...localHistory].forEach((item) => {
      const key = item.id || `${item.file_name}-${item.created_at}`;
      mergedMap.set(key, {
        id: key,
        file_name: item.file_name || DEFAULT_BACKUP_FILE_NAME,
        created_at: item.created_at || new Date().toISOString(),
        size: item.size,
      });
    });
    const merged = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setBackupHistory(merged);
    persistLocalHistory(merged);
  };

  const getBackupBaseCandidates = () => {
    const origin = window.location.origin;
    return Array.from(new Set([
      apiBaseUrl,
      `${origin}/sun_office/api`,
      `${origin}/api`,
    ]));
  };

  const resolveBackupBase = async (): Promise<string | null> => {
    const candidates = getBackupBaseCandidates();
    for (const base of candidates) {
      try {
        const res = await fetch(`${base}/backup.php?action=list`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          setResolvedBackupBase(base);
          return base;
        }
      } catch {
        // try next candidate
      }
    }
    return null;
  };

  const loadBackupHistory = async () => {
    setHistoryLoading(true);
    try {
      const activeBase = (await resolveBackupBase()) || resolvedBackupBase;
      const response = await fetch(`${activeBase}/backup.php?action=list`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to load backup history");
      }
      const data = await response.json();
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      mergeAndSetHistory(rows);
    } catch {
      setBackupHistory(readLocalHistory());
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadBackupHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTakeBackup = async () => {
    setLoading(true);
    try {
      const activeBase = await resolveBackupBase();
      if (!activeBase) {
        throw new Error("Backup API is not reachable");
      }

      // Automatic download without navigating the current tab.
      const createdAt = new Date().toISOString();
      const fileName = DEFAULT_BACKUP_FILE_NAME;
      const downloadUrl = `${activeBase}/backup.php?action=take_download&file=${encodeURIComponent(fileName)}`;

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      setTimeout(() => {
        iframe.remove();
      }, 5000);

      const localHistory = readLocalHistory();
      const newRecord: BackupRecord = {
        id: `local-${Date.now()}`,
        file_name: fileName,
        created_at: createdAt,
      };
      const updated = [newRecord, ...localHistory].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setBackupHistory(updated);
      persistLocalHistory(updated);

      showSnackbar?.("Backup created and downloaded successfully", "success");
      await loadBackupHistory();
    } catch (error: any) {
      showSnackbar?.(
        error?.message || "Failed to take backup from the Node API.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (size?: number | string) => {
    const bytes = Number(size || 0);
    if (!bytes || Number.isNaN(bytes)) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const downloadHistoryFile = async (fileName: string) => {
    const activeBase = (await resolveBackupBase()) || resolvedBackupBase;
    const url = `${activeBase}/backup.php?action=download&file=${encodeURIComponent(fileName)}`;
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => iframe.remove(), 3000);
  };

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <FiDatabase /> Database Backup
        </h2>
        <p style={{ margin: "0 0 16px", color: "#6b7280" }}>
          Click the button below to take a database backup and download the SQL file.
        </p>
        <button
          onClick={handleTakeBackup}
          disabled={loading}
          style={{
            background: loading ? "#9ca3af" : "#059669",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 16px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          <FiDownload />
          {loading ? "Taking Backup..." : "Take Backup"}
        </button>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <FiClock /> Backup History
          </h3>
          <button
            onClick={loadBackupHistory}
            disabled={historyLoading}
            style={{
              border: "1px solid #d1d5db",
              background: "#fff",
              borderRadius: "8px",
              padding: "6px 10px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {backupHistory.length === 0 ? (
          <p style={{ margin: 0, color: "#6b7280" }}>No backups found yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "8px" }}>No</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "8px" }}>File Name</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "8px" }}>Size</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "8px" }}>Date & Time</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "8px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {backupHistory.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: "8px" }}>{index + 1}</td>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: "8px" }}>{item.file_name || DEFAULT_BACKUP_FILE_NAME}</td>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: "8px" }}>{formatSize(item.size)}</td>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: "8px" }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: "8px" }}>
                      <button
                        onClick={() => downloadHistoryFile(item.file_name || DEFAULT_BACKUP_FILE_NAME)}
                        style={{
                          border: "1px solid #d1d5db",
                          background: "#fff",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          cursor: "pointer",
                        }}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupTab;
