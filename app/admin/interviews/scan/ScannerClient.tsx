"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  History,
  ArrowRight,
  Sparkles,
  Clock,
  Send,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { parseClientQrPayload } from "../../../../lib/interviews/qr-client.ts";
import { TRACK_METADATA } from "../../../../lib/admin/transitions.ts";
import type { CommitteeTrack } from "../../../../lib/admin/types.ts";

export interface ScannerClientProps {
  staffEmail: string;
}

export type ScanMode = "camera" | "manual";

export type CameraStatus =
  | "initializing"
  | "requesting_permission"
  | "ready"
  | "permission_denied"
  | "no_cameras"
  | "paused"
  | "error";

export type ResultType =
  | "success"
  | "already_checked_in"
  | "invalid"
  | "revoked_or_expired"
  | "ineligible"
  | "network_error";

export interface CandidateInfo {
  applicationReference: string;
  fullName: string;
  academicId: string;
  primaryTrack: string;
  academicYear: string;
  department: string;
  status: string;
  checkedInAt: string;
}

export interface ScanResultData {
  type: ResultType;
  title: string;
  message: string;
  code?: string;
  candidate?: CandidateInfo;
  checkedInAt?: string;
  recordedBy?: string;
}

export interface SessionScanLog {
  id: string;
  timestamp: string;
  reference: string;
  name: string;
  track: string;
  type: "success" | "duplicate" | "rejected";
}

function playFeedbackSound(type: "success" | "duplicate" | "error") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      // Pleasant high double beep
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === "duplicate") {
      // Amber warning tone
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(350, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Low buzz error
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Gracefully ignore audio errors if blocked
  }
}

function triggerHaptic(type: "success" | "duplicate" | "error") {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      if (type === "success") navigator.vibrate(100);
      else if (type === "duplicate") navigator.vibrate([60, 40, 60]);
      else navigator.vibrate([120, 50, 120]);
    } catch {
      // ignore
    }
  }
}

export default function ScannerClient({ staffEmail }: ScannerClientProps) {
  // Navigation & mode
  const [mode, setMode] = useState<ScanMode>("camera");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Camera states
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("initializing");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  // In-flight & scanning guard
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const hasResultRef = useRef(false);

  // Check-in results
  const [result, setResult] = useState<ScanResultData | null>(null);

  // Manual input state
  const [manualToken, setManualToken] = useState("");
  const [manualInputError, setManualInputError] = useState<string | null>(null);

  // Session stats & log
  const [sessionLogs, setSessionLogs] = useState<SessionScanLog[]>([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, duplicate: 0, rejected: 0 });

  // Camera scanner instance ref
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const containerId = "itc-qr-reader-container";

  // Stop camera tracks cleanly
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("[scanner] Cleanup stop camera:", err);
      }
      html5QrCodeRef.current = null;
    }
  }, []);

  // Submit token to server check-in API
  const processCheckIn = useCallback(
    async (rawPayload: string) => {
      if (isProcessingRef.current || hasResultRef.current) return;

      const token = parseClientQrPayload(rawPayload);
      if (!token) {
        return;
      }

      isProcessingRef.current = true;
      setIsProcessing(true);

      try {
        const response = await fetch("/api/admin/interviews/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        // 1. Success check-in (HTTP 200)
        if (response.status === 200 && data.ok) {
          hasResultRef.current = true;
          const candidate = data.candidate as CandidateInfo;

          if (soundEnabled) playFeedbackSound("success");
          triggerHaptic("success");

          const resultPayload: ScanResultData = {
            type: "success",
            title: "ATTENDANCE VERIFIED & RECORDED",
            message: "Candidate check-in successfully confirmed in the database.",
            code: "CHECK_IN_SUCCESS",
            candidate,
            checkedInAt: candidate.checkedInAt,
            recordedBy: data.recordedBy || staffEmail,
          };

          setResult(resultPayload);
          setStats((prev) => ({ ...prev, total: prev.total + 1, verified: prev.verified + 1 }));
          setSessionLogs((prev) => [
            {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              reference: candidate.applicationReference,
              name: candidate.fullName,
              track: candidate.primaryTrack,
              type: "success",
            },
            ...prev.slice(0, 49),
          ]);
          return;
        }

        // 2. Already checked in (HTTP 409)
        if (response.status === 409 || data.code === "ALREADY_CHECKED_IN") {
          hasResultRef.current = true;
          const candidate = data.candidate as CandidateInfo | undefined;

          if (soundEnabled) playFeedbackSound("duplicate");
          triggerHaptic("duplicate");

          const resultPayload: ScanResultData = {
            type: "already_checked_in",
            title: "ALREADY CHECKED IN",
            message: data.error || "This candidate's attendance was already recorded.",
            code: "ALREADY_CHECKED_IN",
            candidate,
            checkedInAt: data.checkedInAt || candidate?.checkedInAt,
          };

          setResult(resultPayload);
          setStats((prev) => ({ ...prev, total: prev.total + 1, duplicate: prev.duplicate + 1 }));
          setSessionLogs((prev) => [
            {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              reference: candidate?.applicationReference || "UNKNOWN",
              name: candidate?.fullName || "Candidate",
              track: candidate?.primaryTrack || "N/A",
              type: "duplicate",
            },
            ...prev.slice(0, 49),
          ]);
          return;
        }

        // 3. Invalid token (HTTP 404)
        if (response.status === 404 || data.code === "INVALID_TOKEN") {
          hasResultRef.current = true;
          if (soundEnabled) playFeedbackSound("error");
          triggerHaptic("error");

          setResult({
            type: "invalid",
            title: "INVALID QR CODE",
            message: data.error || "No matching candidate found for this credential.",
            code: data.code || "INVALID_TOKEN",
          });
          setStats((prev) => ({ ...prev, total: prev.total + 1, rejected: prev.rejected + 1 }));
          return;
        }

        // 4. Revoked or Expired token (HTTP 400)
        if (data.code === "REVOKED_TOKEN" || data.code === "EXPIRED_TOKEN") {
          hasResultRef.current = true;
          if (soundEnabled) playFeedbackSound("error");
          triggerHaptic("error");

          setResult({
            type: "revoked_or_expired",
            title: data.code === "REVOKED_TOKEN" ? "QR CODE REVOKED" : "QR CODE EXPIRED",
            message: data.error || "This interview credential has been revoked or has expired.",
            code: data.code,
          });
          setStats((prev) => ({ ...prev, total: prev.total + 1, rejected: prev.rejected + 1 }));
          return;
        }

        // 5. Ineligible status (HTTP 400)
        if (data.code === "INELIGIBLE_STATUS") {
          hasResultRef.current = true;
          if (soundEnabled) playFeedbackSound("error");
          triggerHaptic("error");

          setResult({
            type: "ineligible",
            title: "APPLICATION INELIGIBLE",
            message: data.error || "Candidate is not in an approved interview status.",
            code: "INELIGIBLE_STATUS",
          });
          setStats((prev) => ({ ...prev, total: prev.total + 1, rejected: prev.rejected + 1 }));
          return;
        }

        // 6. Generic bad request or database error
        hasResultRef.current = true;
        if (soundEnabled) playFeedbackSound("error");
        triggerHaptic("error");

        setResult({
          type: "network_error",
          title: "CHECK-IN ERROR",
          message: data.error || "Unable to complete check-in request.",
          code: data.code || "ERROR",
        });
        setStats((prev) => ({ ...prev, total: prev.total + 1, rejected: prev.rejected + 1 }));
      } catch (err) {
        hasResultRef.current = true;
        if (soundEnabled) playFeedbackSound("error");
        triggerHaptic("error");

        setResult({
          type: "network_error",
          title: "COMMUNICATION FAILURE",
          message: err instanceof Error ? err.message : "Network error contacting server.",
          code: "NETWORK_ERROR",
        });
        setStats((prev) => ({ ...prev, total: prev.total + 1, rejected: prev.rejected + 1 }));
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [staffEmail, soundEnabled]
  );

  // Start Camera
  const startCamera = useCallback(
    async (cameraId?: string) => {
      if (typeof window === "undefined") return;

      // Ensure container element exists
      const containerEl = document.getElementById(containerId);
      if (!containerEl) {
        setCameraStatus("error");
        setCameraError("Camera viewfinder container not ready.");
        return;
      }

      setCameraStatus("requesting_permission");
      setCameraError(null);

      try {
        await stopCamera();

        // Enumerate video devices
        let cameras: Array<{ id: string; label: string }> = [];
        try {
          cameras = await Html5Qrcode.getCameras();
          setAvailableCameras(cameras);
        } catch {
          // If getCameras fails or permissions prompt needed first
        }

        const scanner = new Html5Qrcode(containerId);
        html5QrCodeRef.current = scanner;

        // Choose camera config: specific deviceId or mobile environment (back) camera
        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : cameras.length > 0
          ? cameras[0].id
          : { facingMode: "environment" };

        await scanner.start(
          cameraConfig,
          {
            fps: 12,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minDim = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(minDim * 0.72);
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success QR frame callback
            if (!isProcessingRef.current && !hasResultRef.current) {
              processCheckIn(decodedText);
            }
          },
          () => {
            // Frame scan failure (continuous polling — silent)
          }
        );

        setCameraStatus("ready");
      } catch (err: unknown) {
        console.error("[scanner] Camera start error:", err);
        const errMsg = err instanceof Error ? err.message : String(err);

        if (
          errMsg.includes("NotAllowedError") ||
          errMsg.includes("Permission denied") ||
          errMsg.includes("denied")
        ) {
          setCameraStatus("permission_denied");
          setCameraError("Camera permission was denied. Please allow camera access in browser settings.");
        } else if (
          errMsg.includes("NotFoundError") ||
          errMsg.includes("DevicesNotFoundError") ||
          errMsg.includes("no camera")
        ) {
          setCameraStatus("no_cameras");
          setCameraError("No camera device was found on this system.");
        } else {
          setCameraStatus("error");
          setCameraError(`Camera initialization failed: ${errMsg}`);
        }
      }
    },
    [processCheckIn, stopCamera]
  );

  // Initialize or stop scanner based on mode
  useEffect(() => {
    let isCancelled = false;

    if (mode === "camera") {
      // Small timeout to guarantee DOM element is mounted
      const timer = setTimeout(() => {
        if (!isCancelled) {
          startCamera(selectedCameraId || undefined);
        }
      }, 150);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [mode, selectedCameraId, startCamera, stopCamera]);

  // Clean unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Dismiss result and resume scanner explicitly
  const resumeScanning = useCallback(() => {
    setResult(null);
    hasResultRef.current = false;
    isProcessingRef.current = false;
    setManualToken("");
    setManualInputError(null);
  }, []);

  // Keyboard shortcut: Press Space or Enter to scan next candidate when result is showing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (result && (e.key === "Enter" || e.key === " " || e.key === "Escape")) {
        e.preventDefault();
        resumeScanning();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [result, resumeScanning]);

  // Manual submit handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualInputError(null);
    const trimmed = manualToken.trim();
    if (!trimmed) {
      setManualInputError("Please enter or paste a valid QR token.");
      return;
    }

    const parsed = parseClientQrPayload(trimmed);
    if (!parsed) {
      setManualInputError("Unable to extract valid token from input.");
      return;
    }

    processCheckIn(parsed);
  };

  // Helper track badge
  const getTrackBadge = (trackCode: string) => {
    const meta = TRACK_METADATA[trackCode.toLowerCase() as CommitteeTrack];
    if (!meta) {
      return (
        <span className="font-mono text-xs px-2 py-0.5 border border-white/20 bg-white/5 uppercase">
          {trackCode}
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-0.5 border uppercase"
        style={{
          borderColor: `${meta.color}55`,
          backgroundColor: `${meta.color}15`,
          color: meta.color,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
        <span>{meta.abbreviation}</span>
        <span className="opacity-75 hidden sm:inline">({meta.name})</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10 bg-[#080a0c] p-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resumeScanning();
              setMode("camera");
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border ${
              mode === "camera"
                ? "bg-[#00e599]/10 text-[#00e599] border-[#00e599]"
                : "border-white/10 text-white/60 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Camera size={14} />
            <span>CAMERA SCANNER</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resumeScanning();
              setMode("manual");
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border ${
              mode === "manual"
                ? "bg-[#00e599]/10 text-[#00e599] border-[#00e599]"
                : "border-white/10 text-white/60 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Keyboard size={14} />
            <span>MANUAL ENTRY</span>
          </button>
        </div>

        {/* Audio feedback & camera selector */}
        <div className="flex items-center gap-3">
          {mode === "camera" && availableCameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                startCamera(e.target.value);
              }}
              className="bg-[#050708] border border-white/10 text-xs font-mono text-white/80 px-2.5 py-1.5 focus:border-[#00e599] focus:outline-none"
            >
              {availableCameras.map((cam, idx) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute audio beeps" : "Enable audio beeps"}
            className="p-2 border border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            {soundEnabled ? <Volume2 size={15} className="text-[#00e599]" /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Scanner Viewport (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-white/10 bg-[#080a0c] p-4 sm:p-6 relative overflow-hidden">
            {/* Emerald header strip */}
            <div className="h-0.5 w-full absolute top-0 left-0 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#00e599]" />

            {/* Viewfinder / Input container */}
            {mode === "camera" ? (
              <div className="space-y-4">
                {/* Status Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isProcessing
                          ? "bg-[#18c8ed] animate-ping"
                          : cameraStatus === "ready"
                          ? "bg-[#00e599] animate-pulse"
                          : cameraStatus === "permission_denied" || cameraStatus === "error"
                          ? "bg-rose-500"
                          : "bg-amber-400"
                      }`}
                    />
                    <span className="font-mono text-xs uppercase tracking-wider text-white/80">
                      {isProcessing
                        ? "VERIFYING CANDIDATE WITH SERVER..."
                        : cameraStatus === "ready"
                        ? "READY · ALIGN QR CODE"
                        : cameraStatus === "requesting_permission"
                        ? "REQUESTING CAMERA ACCESS..."
                        : cameraStatus === "permission_denied"
                        ? "PERMISSION DENIED"
                        : cameraStatus === "no_cameras"
                        ? "NO CAMERA FOUND"
                        : "CAMERA INITIALIZING..."}
                    </span>
                  </div>

                  {cameraStatus === "ready" && (
                    <button
                      type="button"
                      onClick={() => startCamera(selectedCameraId || undefined)}
                      title="Restart camera stream"
                      className="text-white/40 hover:text-white text-xs font-mono flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw size={12} />
                      <span>RELOAD</span>
                    </button>
                  )}
                </div>

                {/* Optical Viewfinder Box */}
                <div className="relative aspect-square max-w-md mx-auto bg-[#050708] border border-white/10 overflow-hidden flex items-center justify-center">
                  {/* html5-qrcode video mount element */}
                  <div
                    id={containerId}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      cameraStatus === "ready" ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  />

                  {/* Overlaid Viewfinder Targets (visible when camera is ready & no result) */}
                  {cameraStatus === "ready" && !result && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                      {/* 4 Corner Targeting Reticles */}
                      <div className="relative w-64 h-64 border border-white/10">
                        {/* Top-Left */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#00e599]" />
                        {/* Top-Right */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#00e599]" />
                        {/* Bottom-Left */}
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#00e599]" />
                        {/* Bottom-Right */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#00e599]" />

                        {/* Animated Laser Scanning Line */}
                        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00e599] to-transparent shadow-[0_0_12px_#00e599] animate-laser-sweep" />

                        {/* Center crosshair */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 border border-[#00e599]/30 rounded-full" />
                        </div>
                      </div>

                      <p className="font-mono text-[11px] text-white/50 tracking-wider uppercase mt-4 bg-[#080a0c]/80 px-3 py-1 border border-white/5">
                        CENTER INTERVIEW QR IN FRAME
                      </p>
                    </div>
                  )}

                  {/* Camera Permission Denied Screen */}
                  {cameraStatus === "permission_denied" && (
                    <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[#080a0c]">
                      <div className="w-12 h-12 flex items-center justify-center border border-rose-500/40 bg-rose-500/10 text-rose-400">
                        <CameraOff size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                          CAMERA ACCESS WAS DENIED
                        </h3>
                        <p className="text-xs text-white/60 max-w-xs leading-relaxed">
                          {cameraError ||
                            "Your browser or device blocked camera permission. Enable camera access in site settings, or switch to manual token entry."}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => startCamera(selectedCameraId || undefined)}
                          className="px-4 py-2 border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599]/20 font-mono text-xs uppercase font-semibold cursor-pointer"
                        >
                          TRY AGAIN
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode("manual")}
                          className="px-4 py-2 border border-white/10 bg-white/5 text-white hover:bg-white/10 font-mono text-xs uppercase cursor-pointer"
                        >
                          USE MANUAL ENTRY
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Camera Unavailable Screen */}
                  {cameraStatus === "no_cameras" && (
                    <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[#080a0c]">
                      <div className="w-12 h-12 flex items-center justify-center border border-amber-500/40 bg-amber-500/10 text-amber-400">
                        <CameraOff size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                          NO CAMERA DEVICE DETECTED
                        </h3>
                        <p className="text-xs text-white/60 max-w-xs leading-relaxed">
                          {cameraError ||
                            "No optical video camera was found connected to this system. Use the manual token entry fallback below."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMode("manual")}
                        className="px-4 py-2 border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599]/20 font-mono text-xs uppercase font-semibold cursor-pointer"
                      >
                        SWITCH TO MANUAL ENTRY
                      </button>
                    </div>
                  )}

                  {/* Camera Error Screen */}
                  {cameraStatus === "error" && (
                    <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[#080a0c]">
                      <div className="w-12 h-12 flex items-center justify-center border border-rose-500/40 bg-rose-500/10 text-rose-400">
                        <CameraOff size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                          CAMERA STREAM ERROR
                        </h3>
                        <p className="text-xs text-white/60 max-w-xs leading-relaxed">
                          {cameraError || "Unable to start video stream. Try reloading or using manual entry."}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => startCamera(selectedCameraId || undefined)}
                          className="px-4 py-2 border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599]/20 font-mono text-xs uppercase font-semibold cursor-pointer"
                        >
                          RELOAD CAMERA
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode("manual")}
                          className="px-4 py-2 border border-white/10 bg-white/5 text-white hover:bg-white/10 font-mono text-xs uppercase cursor-pointer"
                        >
                          MANUAL ENTRY
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Camera Initializing Screen */}
                  {cameraStatus === "initializing" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-3 bg-[#080a0c]">
                      <RefreshCw size={24} className="text-[#00e599] animate-spin" />
                      <p className="font-mono text-xs text-white/60 uppercase tracking-wider">
                        INITIALIZING OPTICAL SENSOR...
                      </p>
                    </div>
                  )}

                  {/* In-Flight Processing Spinner Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-[#080a0c]/85 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-3 z-20">
                      <div className="w-10 h-10 border-2 border-[#00e599] border-t-transparent rounded-full animate-spin" />
                      <div className="space-y-1">
                        <p className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                          VERIFYING CREDENTIALS
                        </p>
                        <p className="text-[11px] text-[#00e599] font-mono">
                          Checking eligibility & recording timestamp...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Manual Entry Form */
              <div className="space-y-6">
                <div>
                  <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                    MANUAL TOKEN ENTRY FALLBACK
                  </h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Type or paste the candidate&apos;s interview QR token or full JSON payload. The server
                    will validate eligibility and record attendance.
                  </p>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="manual-token-input"
                      className="block font-mono text-xs text-white/70 uppercase tracking-wider mb-2"
                    >
                      QR TOKEN OR PROTOCOL PAYLOAD
                    </label>
                    <textarea
                      id="manual-token-input"
                      rows={4}
                      value={manualToken}
                      onChange={(e) => {
                        setManualToken(e.target.value);
                        setManualInputError(null);
                      }}
                      placeholder='itc_qr_... OR {"protocol":"itc-interview-v1","token":"..."}'
                      className="w-full bg-[#050708] border border-white/15 px-3 py-2.5 font-mono text-xs text-white placeholder-white/30 focus:border-[#00e599] focus:outline-none transition-colors"
                      disabled={isProcessing}
                    />
                    {manualInputError && (
                      <p className="text-xs font-mono text-rose-400 mt-1.5 flex items-center gap-1.5">
                        <AlertTriangle size={13} />
                        <span>{manualInputError}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isProcessing || !manualToken.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00e599] text-[#050708] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#00ffaa] disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>PROCESSING...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>VERIFY & CHECK IN</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setManualToken("")}
                      disabled={isProcessing || !manualToken}
                      className="px-3 py-2.5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-mono text-xs uppercase disabled:opacity-30 transition-colors"
                    >
                      CLEAR
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Result Card: Renders right below or as primary modal */}
          {result && (
            <div
              className={`border p-6 transition-all animate-fadeIn ${
                result.type === "success"
                  ? "border-[#00e599]/60 bg-[#00e599]/[0.05]"
                  : result.type === "already_checked_in"
                  ? "border-amber-500/60 bg-amber-500/[0.05]"
                  : "border-rose-500/60 bg-rose-500/[0.05]"
              }`}
            >
              {/* Header Status Bar */}
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center border ${
                      result.type === "success"
                        ? "border-[#00e599]/60 bg-[#00e599]/20 text-[#00e599]"
                        : result.type === "already_checked_in"
                        ? "border-amber-500/60 bg-amber-500/20 text-amber-400"
                        : "border-rose-500/60 bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {result.type === "success" && <CheckCircle2 size={20} />}
                    {result.type === "already_checked_in" && <AlertTriangle size={20} />}
                    {result.type !== "success" && result.type !== "already_checked_in" && (
                      <XCircle size={20} />
                    )}
                  </div>

                  <div>
                    <span
                      className={`font-mono text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border ${
                        result.type === "success"
                          ? "border-[#00e599]/40 bg-[#00e599]/15 text-[#00e599]"
                          : result.type === "already_checked_in"
                          ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                          : "border-rose-500/40 bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {result.code || result.type.toUpperCase()}
                    </span>
                    <h3 className="font-mono text-base font-bold text-white mt-1 uppercase tracking-tight">
                      {result.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resumeScanning}
                  className="text-white/40 hover:text-white font-mono text-xs uppercase px-2.5 py-1 border border-white/10 hover:border-white/20 transition-colors"
                >
                  ESC / CLOSE
                </button>
              </div>

              {/* Verified Candidate Information Card */}
              {result.candidate ? (
                <div className="space-y-4">
                  {/* Candidate Name & Track */}
                  <div className="bg-[#050708] border border-white/10 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[10px] tracking-wider text-white/40 uppercase">
                        CANDIDATE PROFILE
                      </span>
                      {getTrackBadge(result.candidate.primaryTrack)}
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-white tracking-tight">
                        {result.candidate.fullName}
                      </h4>
                      <p className="font-mono text-xs text-[#00e599] mt-0.5">
                        REF: {result.candidate.applicationReference}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
                      <div>
                        <span className="font-mono text-[10px] text-white/40 uppercase block">
                          ACADEMIC YEAR
                        </span>
                        <span className="text-white/80 font-mono capitalize">
                          {result.candidate.academicYear} Year
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-white/40 uppercase block">
                          DEPARTMENT
                        </span>
                        <span className="text-white/80 font-mono truncate block">
                          {result.candidate.department || "General"}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-white/40 uppercase block">
                          STUDENT ID
                        </span>
                        <span className="text-white/80 font-mono">
                          {result.candidate.academicId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Details */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono px-1">
                    <div className="flex items-center gap-2 text-white/60">
                      <Clock size={13} className="text-[#00e599]" />
                      <span>
                        {result.type === "success" ? "CHECKED IN AT:" : "PREVIOUS CHECK-IN:"}{" "}
                        {result.checkedInAt
                          ? new Date(result.checkedInAt).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "RECORDED"}
                      </span>
                    </div>

                    {result.recordedBy && (
                      <span className="text-white/40 text-[11px]">
                        STAFF: {result.recordedBy}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* Non-candidate Error Message */
                <div className="bg-[#050708] border border-white/10 p-4">
                  <p className="text-sm text-white/80 leading-relaxed font-mono">
                    {result.message}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={resumeScanning}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    result.type === "success"
                      ? "bg-[#00e599] text-[#050708] hover:bg-[#00ffaa]"
                      : result.type === "already_checked_in"
                      ? "bg-amber-400 text-[#050708] hover:bg-amber-300"
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                  }`}
                >
                  <span>
                    {result.type === "success"
                      ? "SCAN NEXT CANDIDATE (SPACE)"
                      : result.type === "already_checked_in"
                      ? "DISMISS & CONTINUE (SPACE)"
                      : "RETRY / SCAN NEXT"}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Session Statistics & Check-In History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Metrics */}
          <div className="border border-white/10 bg-[#080a0c] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={13} className="text-[#00e599]" />
                <span>SESSION AUDIT</span>
              </span>
              <span className="font-mono text-[10px] text-[#00e599] uppercase">LIVE</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="border border-white/10 bg-[#050708] p-3 text-center">
                <span className="font-mono text-[10px] text-white/40 uppercase block">VERIFIED</span>
                <span className="font-mono text-xl font-bold text-[#00e599]">{stats.verified}</span>
              </div>
              <div className="border border-white/10 bg-[#050708] p-3 text-center">
                <span className="font-mono text-[10px] text-white/40 uppercase block">DUPLICATES</span>
                <span className="font-mono text-xl font-bold text-amber-400">{stats.duplicate}</span>
              </div>
              <div className="border border-white/10 bg-[#050708] p-3 text-center">
                <span className="font-mono text-[10px] text-white/40 uppercase block">REJECTED</span>
                <span className="font-mono text-xl font-bold text-rose-400">{stats.rejected}</span>
              </div>
            </div>
          </div>

          {/* Session Activity Feed */}
          <div className="border border-white/10 bg-[#080a0c] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <History size={13} className="text-white/40" />
                <span>RECENT SCANS</span>
              </span>
              <span className="font-mono text-[10px] text-white/40">
                {sessionLogs.length} PROCESSED
              </span>
            </div>

            {sessionLogs.length === 0 ? (
              <div className="py-8 text-center text-white/30 font-mono text-xs space-y-1">
                <p>No scans recorded in this session yet.</p>
                <p className="text-[10px]">Align a candidate QR to begin.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {sessionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-white/10 bg-[#050708] p-2.5 flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold truncate">{log.name}</span>
                        <span className="text-[10px] text-white/40 uppercase font-normal">
                          {log.track}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#00e599]/80 block mt-0.5">
                        {log.reference} · {log.timestamp}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 border shrink-0 ${
                        log.type === "success"
                          ? "border-[#00e599]/40 bg-[#00e599]/15 text-[#00e599]"
                          : log.type === "duplicate"
                          ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                          : "border-rose-500/40 bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {log.type === "success"
                        ? "VERIFIED"
                        : log.type === "duplicate"
                        ? "DUPLICATE"
                        : "REJECTED"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Committee Guidelines & Checklist */}
          <div className="border border-white/10 bg-[#080a0c] p-4 space-y-2 text-xs font-mono text-white/60">
            <span className="text-[10px] text-[#00e599] uppercase font-bold tracking-wider block">
              CHECK-IN INSTRUCTIONS FOR STAFF
            </span>
            <ul className="space-y-1.5 text-[11px] leading-relaxed list-disc list-inside text-white/50">
              <li>Candidates show their QR on mobile screen or printed attendance card.</li>
              <li>Attendance is recorded atomically in the database upon the first scan.</li>
              <li>Duplicate scans are strictly blocked and flagged with original timestamp.</li>
              <li>Confirm candidate identity matches the verified name before proceeding.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
