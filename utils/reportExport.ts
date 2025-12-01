import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { storage, DPFHistoryEntry } from "./storage";
import { getVehicleBrand } from "@/constants/vehicles";

export interface DiagnosticReport {
  generatedAt: string;
  vehicleBrand: string;
  vehicleName: string;
  totalRegenerations: number;
  completedRegenerations: number;
  stoppedRegenerations: number;
  averageDuration: string;
  lastRegeneration: string | null;
  history: DPFHistoryEntry[];
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export async function generateReport(vehicleId: string | null): Promise<DiagnosticReport> {
  const history = await storage.getDPFHistory();
  const vehicleBrand = vehicleId ? getVehicleBrand(vehicleId) : null;
  
  const filteredHistory = vehicleId 
    ? history.filter((h) => h.brand === vehicleId)
    : history;
  
  const completed = filteredHistory.filter((h) => h.completed);
  const stopped = filteredHistory.filter((h) => !h.completed);
  
  const totalDuration = filteredHistory.reduce((acc, h) => acc + (h.endTime - h.startTime), 0);
  const avgDuration = filteredHistory.length > 0 
    ? totalDuration / filteredHistory.length 
    : 0;
  
  const lastRegen = filteredHistory.length > 0 ? filteredHistory[0] : null;
  
  return {
    generatedAt: new Date().toISOString(),
    vehicleBrand: vehicleId || "All Vehicles",
    vehicleName: vehicleBrand?.name || "All Brands",
    totalRegenerations: filteredHistory.length,
    completedRegenerations: completed.length,
    stoppedRegenerations: stopped.length,
    averageDuration: formatDuration(avgDuration),
    lastRegeneration: lastRegen ? formatDate(lastRegen.endTime) : null,
    history: filteredHistory,
  };
}

export function generateTextReport(report: DiagnosticReport): string {
  let text = `
=====================================
      VAG DIAGNOSTICS REPORT
=====================================

Generated: ${new Date(report.generatedAt).toLocaleString()}
Vehicle: ${report.vehicleName}

----- SUMMARY -----
Total Regenerations: ${report.totalRegenerations}
Completed: ${report.completedRegenerations}
Stopped Early: ${report.stoppedRegenerations}
Average Duration: ${report.averageDuration}
Last Regeneration: ${report.lastRegeneration || "Never"}

----- HISTORY -----
`;

  if (report.history.length === 0) {
    text += "\nNo regeneration history available.\n";
  } else {
    report.history.forEach((entry, index) => {
      const brand = getVehicleBrand(entry.brand);
      const duration = formatDuration(entry.endTime - entry.startTime);
      const status = entry.completed ? "COMPLETED" : "STOPPED";
      
      text += `
${index + 1}. ${brand?.name || entry.brand}
   Date: ${formatDate(entry.startTime)}
   Duration: ${duration}
   Progress: ${Math.round(entry.progress)}%
   Status: ${status}
`;
    });
  }

  text += `
=====================================
      END OF REPORT
=====================================
`;

  return text;
}

export function generateCSVReport(report: DiagnosticReport): string {
  let csv = "ID,Brand,Start Time,End Time,Duration (s),Progress (%),Status\n";
  
  report.history.forEach((entry) => {
    const brand = getVehicleBrand(entry.brand);
    const durationSeconds = Math.floor((entry.endTime - entry.startTime) / 1000);
    const status = entry.completed ? "Completed" : "Stopped";
    
    csv += `${entry.id},${brand?.name || entry.brand},${formatDate(entry.startTime)},${formatDate(entry.endTime)},${durationSeconds},${Math.round(entry.progress)},${status}\n`;
  });
  
  return csv;
}

export function generateJSONReport(report: DiagnosticReport): string {
  return JSON.stringify(report, null, 2);
}

export async function exportReport(
  format: "txt" | "csv" | "json",
  vehicleId: string | null
): Promise<boolean> {
  try {
    const report = await generateReport(vehicleId);
    
    let content: string;
    let extension: string;
    let mimeType: string;
    
    switch (format) {
      case "csv":
        content = generateCSVReport(report);
        extension = "csv";
        mimeType = "text/csv";
        break;
      case "json":
        content = generateJSONReport(report);
        extension = "json";
        mimeType = "application/json";
        break;
      default:
        content = generateTextReport(report);
        extension = "txt";
        mimeType = "text/plain";
    }
    
    if (Platform.OS === "web") {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vag-diagnostics-report.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }
    
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.error("Sharing is not available on this device");
      return false;
    }
    
    const fileName = `vag-diagnostics-report.${extension}`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(filePath, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    await Sharing.shareAsync(filePath, {
      mimeType,
      dialogTitle: "Export Diagnostic Report",
    });
    
    return true;
  } catch (error) {
    console.error("Failed to export report:", error);
    return false;
  }
}
