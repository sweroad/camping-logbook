import { useState, type ReactNode } from "react";
import { downloadExport } from "../../api/export";
import { ApiError } from "../../api/client";
import type { StatsRange } from "../../types/stats";

interface ExportButtonProps {
  range: StatsRange;
  children: ReactNode;
}

export default function ExportButton({ range, children }: ExportButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setIsDownloading(true);
    try {
      await downloadExport(range);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Export failed");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="export-button">
      <button type="button" onClick={handleClick} disabled={isDownloading}>
        {isDownloading ? "Preparing..." : children}
      </button>
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
