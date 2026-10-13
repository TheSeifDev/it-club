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
  Info,
  Lock,
  Power,
  ShieldAlert,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { parseClientQrPayload, isValidQrTokenFormat } from "../../../../lib/interviews/qr-client.ts";
import {
  classifyCameraError,
  diagnoseCameraEnvironment,
  type CameraErrorInfo,
  type CameraEnvironmentDiagnostic,
} from "../../../../lib/interviews/camera-diagnostics.ts";
import { TRACK_METADATA } from "../../../../lib/admin/transitions.ts";
import type { CommitteeTrack } from "../../../../lib/admin/types.ts";

export interface ScannerClientProps {
  staffEmail: string;
}

export type ScanMode = "camera" | "manual";

export type CameraStatus =
  | "idle"
  | "checking_environment"
  | "requesting_permission"
  | "scanning"
  | "paused"
  | "permission_denied"
  | "no_cameras"
  | "not_readable"
  | "overconstrained"
  | "insecure_context"
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
    // Gracefully ignore audio errors if blocked by browser policy
  }
}

function triggerHaptic(type: "success" | "duplicate" | "error") {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      if (type === "success") navigator.vibrate(100);
      else if (type === "duplicate") navigator.vibrate([60, 40, 60]);
      else navigator.vibrate([120, 50, 120]);
    } catch {
      // Gracefully ignore vibrate errors
    }
  }
}

export default function ScannerClient({ staffEmail }: ScannerClientProps) {
  // Navigation & mode
  const [mode, setMode] = useState<ScanMode>("camera");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Environment diagnostics
  const [envDiagnostic, setEnvDiagnostic] = useState<CameraEnvironmentDiagnostic | null>(null);

  // Camera states
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [cameraErrorInfo, setCameraErrorInfo] = useState<CameraErrorInfo | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  // In-flight & scanning guard
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const hasResultRef = useRef(false);
  const isStartingRef = useRef(false);
  const isMountedRef = useRef(true);

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

  // Check environment diagnostics once on mount without starting camera
  useEffect(() => {
    isMountedRef.current = true;
    diagnoseCameraEnvironment().then((diag) => {
      if (isMountedRef.current) {
        setEnvDiagnostic(diag);
        if (!diag.isSecureContext) {
          setCameraStatus("insecure_context");
          setCameraErrorInfo(
            classifyCameraError(
              new Error("Insecure context: Camera scanning requires HTTPS or localhost.")
            )
          );
        } else if (!diag.hasGetUserMedia) {
          setCameraStatus("error");
          setCameraErrorInfo(
            classifyCameraError(
              new Error("Unsupported browser: navigator.mediaDevices.getUserMedia is unavailable.")
            )
          );
        }
      }
    });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        // Non-fatal cleanup warning
        console.warn("[scanner] Camera stream release warning:", err);
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
              timestamp: new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
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
              timestamp: new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
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

  // Explicit Start Camera with comprehensive diagnostics and error classification
  const startCamera = useCallback(
    async (cameraId?: string) => {
      if (typeof window === "undefined" || !isMountedRef.current) return;
      if (isStartingRef.current) return;

      isStartingRef.current = true;
      setCameraStatus("requesting_permission");
      setCameraErrorInfo(null);

      // Pre-flight check: ensure container exists
      const containerEl = document.getElementById(containerId);
      if (!containerEl) {
        isStartingRef.current = false;
        setCameraStatus("error");
        setCameraErrorInfo(
          classifyCameraError(new Error("Viewfinder DOM container not mounted."))
        );
        return;
      }

      // Pre-flight check: secure context
      const diag = await diagnoseCameraEnvironment();
      if (!diag.isSecureContext) {
        isStartingRef.current = false;
        setCameraStatus("insecure_context");
        setCameraErrorInfo(classifyCameraError(new Error("Insecure context")));
        return;
      }

      if (!diag.hasGetUserMedia) {
        isStartingRef.current = false;
        setCameraStatus("error");
        setCameraErrorInfo(
          classifyCameraError(
            new Error("Camera APIs not supported by this browser.")
          )
        );
        return;
      }

      try {
        await stopCamera();

        // Enumerate video devices safely
        let cameras: Array<{ id: string; label: string }> = [];
        try {
          cameras = await Html5Qrcode.getCameras();
          if (isMountedRef.current) {
            setAvailableCameras(cameras);
          }
        } catch {
          // If getCameras fails or permissions prompt needed first, continue to start
        }

        if (!isMountedRef.current) {
          isStartingRef.current = false;
          return;
        }

        const scanner = new Html5Qrcode(containerId);
        html5QrCodeRef.current = scanner;

        // Config priority:
        // 1. Explicit cameraId selected by staff
        // 2. Mobile rear camera { facingMode: "environment" }
        // 3. Fallback to first enumerated camera id
        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: "environment" };

        const scannerConfig = {
          fps: 12,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            // Responsive mobile-friendly scan window size
            const size = Math.floor(minDim * 0.72);
            return { width: Math.max(size, 200), height: Math.max(size, 200) };
          },
          aspectRatio: 1.0,
        };

        const onScanSuccess = (decodedText: string) => {
          if (!isProcessingRef.current && !hasResultRef.current) {
            processCheckIn(decodedText);
          }
        };

        const onScanFailure = () => {
          // Continuous video frame polling — silent per frame
        };

        try {
          await scanner.start(cameraConfig, scannerConfig, onScanSuccess, onScanFailure);
        } catch (initialErr: unknown) {
          // If environment constraint failed (OverconstrainedError) on devices without back camera,
          // automatically retry with unconstrained fallback or front camera
          const classified = classifyCameraError(initialErr);
          if (classified.code === "overconstrained" || !cameraId) {
            console.info("[scanner] Retrying with generic camera constraints...");
            await scanner.start(
              cameras.length > 0 ? cameras[0].id : { facingMode: "user" },
              scannerConfig,
              onScanSuccess,
              onScanFailure
            );
          } else {
            throw initialErr;
          }
        }

        if (isMountedRef.current) {
          setCameraStatus("scanning");
          // Re-enumerate cameras now that permission has been granted so labels appear
          try {
            const refreshedCameras = await Html5Qrcode.getCameras();
            if (isMountedRef.current && refreshedCameras.length > 0) {
              setAvailableCameras(refreshedCameras);
            }
          } catch {
            // Ignore background re-enumeration errors
          }
        }
      } catch (err: unknown) {
        if (!isMountedRef.current) return;

        const info = classifyCameraError(err);
        setCameraErrorInfo(info);

        if (info.isExpectedDenial) {
          // Non-alarming diagnostic logging for normal permission rejection
          console.info(
            "[scanner] Camera permission denied by user or browser policy:",
            info.message
          );
          setCameraStatus("permission_denied");
        } else if (info.code === "not_found") {
          console.warn("[scanner] No camera hardware found:", info.message);
          setCameraStatus("no_cameras");
        } else if (info.code === "not_readable") {
          console.warn("[scanner] Camera hardware locked or in use:", info.message);
          setCameraStatus("not_readable");
        } else if (info.code === "insecure_context") {
          console.warn("[scanner] Insecure context:", info.message);
          setCameraStatus("insecure_context");
        } else {
          // Real unexpected failure: retain error logging without leaking tokens or applicant data
          console.error("[scanner] Unexpected camera initialization failure:", info.message);
          setCameraStatus("error");
        }
      } finally {
        isStartingRef.current = false;
      }
    },
    [processCheckIn, stopCamera]
  );

  // Switch to manual mode cleanly releases camera stream
  const handleSwitchMode = useCallback(
    async (nextMode: ScanMode) => {
      if (nextMode === mode) return;
      if (mode === "camera") {
        await stopCamera();
        setCameraStatus("idle");
      }
      setMode(nextMode);
      setManualInputError(null);
    },
    [mode, stopCamera]
  );

  // Explicit camera shutdown
  const handleStopCamera = useCallback(async () => {
    await stopCamera();
    setCameraStatus("idle");
  }, [stopCamera]);

  // Clean unmount guaranteed
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
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

  // Keyboard shortcut: Press Space, Enter, or Escape to dismiss result and scan next
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

    if (!isValidQrTokenFormat(parsed)) {
      setManualInputError("Token format is invalid or too short.");
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
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10 bg-[#080a0c] p-3 sm:p-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tab-camera-mode"
            onClick={() => handleSwitchMode("camera")}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border min-h-[44px] ${
              mode === "camera"
                ? "bg-[#00e599]/10 text-[#00e599] border-[#00e599]"
                : "border-white/10 text-white/60 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Camera size={15} />
            <span>CAMERA SCANNER</span>
          </button>

          <button
            type="button"
            id="tab-manual-mode"
            onClick={() => handleSwitchMode("manual")}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border min-h-[44px] ${
              mode === "manual"
                ? "bg-[#00e599]/10 text-[#00e599] border-[#00e599]"
                : "border-white/10 text-white/60 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Keyboard size={15} />
            <span>MANUAL ENTRY</span>
          </button>
        </div>

        {/* Audio feedback & camera selector */}
        <div className="flex items-center gap-3">
          {mode === "camera" && availableCameras.length > 1 && (
            <select
              id="camera-device-select"
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                if (cameraStatus === "scanning") {
                  startCamera(e.target.value);
                }
              }}
              className="bg-[#050708] border border-white/10 text-xs font-mono text-white/80 px-2.5 py-2 min-h-[44px] focus:border-[#00e599] focus:outline-none"
              title="Select camera sensor"
            >
              <option value="">Default (Rear Camera)</option>
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
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center border border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 size={16} className="text-[#00e599]" />
            ) : (
              <VolumeX size={16} />
            )}
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
                {/* Status Indicator Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isProcessing
                          ? "bg-[#18c8ed] animate-ping"
                          : cameraStatus === "scanning"
                          ? "bg-[#00e599] animate-pulse"
                          : cameraStatus === "permission_denied" || cameraStatus === "error"
                          ? "bg-rose-500"
                          : cameraStatus === "no_cameras" || cameraStatus === "not_readable"
                          ? "bg-amber-400"
                          : "bg-white/40"
                      }`}
                    />
                    <span className="font-mono text-xs uppercase tracking-wider text-white/80">
                      {isProcessing
                        ? "VERIFYING CANDIDATE WITH SERVER..."
                        : cameraStatus === "scanning"
                        ? "READY · ALIGN QR CODE"
                        : cameraStatus === "requesting_permission"
                        ? "REQUESTING CAMERA ACCESS..."
                        : cameraStatus === "permission_denied"
                        ? "PERMISSION DENIED"
                        : cameraStatus === "no_cameras"
                        ? "NO CAMERA FOUND"
                        : cameraStatus === "not_readable"
                        ? "CAMERA HARDWARE BUSY"
                        : cameraStatus === "insecure_context"
                        ? "INSECURE CONTEXT (HTTPS REQUIRED)"
                        : "CAMERA READY TO START"}
                    </span>
                  </div>

                  {cameraStatus === "scanning" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera(selectedCameraId || undefined)}
                        title="Restart camera stream"
                        className="text-white/50 hover:text-white text-xs font-mono flex items-center gap-1 transition-colors px-2 py-1 border border-white/10 hover:border-white/20"
                      >
                        <RefreshCw size={12} />
                        <span className="hidden sm:inline">RELOAD</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStopCamera}
                        title="Stop camera video stream"
                        className="text-rose-400/80 hover:text-rose-400 text-xs font-mono flex items-center gap-1 transition-colors px-2 py-1 border border-rose-500/20 hover:border-rose-500/40"
                      >
                        <Power size={12} />
                        <span className="hidden sm:inline">STOP</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Optical Viewfinder Box */}
                <div className="relative aspect-square max-w-md w-full mx-auto bg-[#050708] border border-white/10 overflow-hidden flex items-center justify-center">
                  {/* html5-qrcode video mount element */}
                  <div
                    id={containerId}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      cameraStatus === "scanning" ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  />

                  {/* Overlaid Viewfinder Targets (visible when camera is actively scanning & no result) */}
                  {cameraStatus === "scanning" && !result && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                      {/* 4 Corner Targeting Reticles */}
                      <div className="relative w-56 sm:w-64 h-56 sm:h-64 border border-white/10">
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

                      <p className="font-mono text-[11px] text-white/60 tracking-wider uppercase mt-4 bg-[#080a0c]/85 px-3 py-1 border border-white/10">
                        CENTER INTERVIEW QR IN FRAME
                      </p>
                    </div>
                  )}

                  {/* State 1: IDLE / READY TO START SCREEN (No automatic permission request on mount!) */}
                  {cameraStatus === "idle" && (
                    <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[#080a0c]">
                      <div className="w-14 h-14 flex items-center justify-center border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599]">
                        <Camera size={28} />
                      </div>
                      <div className="space-y-1.5 max-w-xs">
                        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                          OPTICAL SCANNER READY
                        </h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          Click below to start your camera and begin scanning candidate interview QR codes.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-xs">
                        <button
                          type="button"
                          id="btn-start-camera"
                          onClick={() => startCamera(selectedCameraId || undefined)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#00e599] text-[#050708] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#00ffaa] transition-colors cursor-pointer min-h-[44px]"
                        >
                          <Camera size={14} />
                          <span>START CAMERA</span>
                        </button>

                        <button
                          type="button"
                          id="btn-switch-manual-from-idle"
                          onClick={() => handleSwitchMode("manual")}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 border border-white/10 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 font-mono text-xs uppercase transition-colors cursor-pointer min-h-[44px]"
                        >
                          <Keyboard size={14} />
                          <span>MANUAL ENTRY</span>
                        </button>
                      </div>

                      {/* Environmental Diagnostic Pills */}
                      {envDiagnostic && (
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-white/40">
                          <span className="border border-white/10 px-2 py-0.5 bg-white/[0.02]">
                            CONTEXT: {envDiagnostic.isSecureContext ? "HTTPS/SECURE" : "INSECURE"}
                          </span>
                          <span className="border border-white/10 px-2 py-0.5 bg-white/[0.02]">
                            WEBRTC: {envDiagnostic.hasGetUserMedia ? "SUPPORTED" : "UNAVAILABLE"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* State 2: REQUESTING PERMISSION / INITIALIZING */}
                  {cameraStatus === "requesting_permission" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-3 bg-[#080a0c] p-6">
                      <RefreshCw size={28} className="text-[#00e599] animate-spin" />
                      <div className="space-y-1">
                        <p className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                          INITIALIZING OPTICAL SENSOR...
                        </p>
                        <p className="text-[11px] text-white/50 max-w-xs">
                          Please accept the camera permission prompt in your browser if requested.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* State 3: PERMISSION DENIED (Comprehensive Instructions + Try Again + Manual Entry) */}
                  {cameraStatus === "permission_denied" && (
                    <div
                      id="scanner-permission-denied-panel"
                      className="absolute inset-0 p-5 sm:p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[#080a0c] overflow-y-auto"
                    >
                      <div className="w-12 h-12 flex items-center justify-center border border-rose-500/40 bg-rose-500/10 text-rose-400 shrink-0">
                        <CameraOff size={24} />
                      </div>

                      <div className="space-y-1.5 max-w-sm">
                        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                          CAMERA PERMISSION DENIED
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                          {cameraErrorInfo?.message ||
                            "Browser or operating-system camera permission was denied."}
                        </p>
                      </div>

                      {/* Step-by-Step Instructions */}
                      <div className="w-full max-w-sm bg-[#050708] border border-white/10 p-3 text-left space-y-2">
                        <span className="text-[10px] font-mono text-[#00e599] uppercase font-bold flex items-center gap-1.5">
                          <Lock size={12} />
                          <span>HOW TO ENABLE CAMERA ACCESS:</span>
                        </span>
                        <ol className="text-[11px] font-mono text-white/60 space-y-1.5 list-decimal list-inside leading-relaxed">
                          <li>Click the camera or lock icon in your browser address bar.</li>
                          <li>Change camera permission from &quot;Block&quot; to &quot;Allow&quot;.</li>
                          <li>Click &quot;Try Again&quot; below or reload this page.</li>
                        </ol>
                      </div>

                      {/* Two Obvious Primary Actions: Try Again + Manual Entry */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full max-w-sm">
                        <button
                          type="button"
                          id="btn-retry-camera"
                          onClick={() => startCamera(selectedCameraId || undefined)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599]/20 font-mono text-xs uppercase font-semibold cursor-pointer min-h-[44px]"
                        >
                          <RefreshCw size={13} />
                          <span>TRY AGAIN</span>
                        </button>

                        <button
                          type="button"
                          id="btn-permission-use-manual"
                          onClick={() => handleSwitchMode("manual")}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-white/15 bg-white/5 text-white hover:bg-white/10 font-mono text-xs uppercase cursor-pointer min-h-[44px]"
                        >
                          <Keyboard size={13} />
                          <span>ENTER TOKEN MANUALLY</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* State 4: NO CAMERA FOUND */}
                  {cameraStatus === "no_cameras" && (
                    <div
                      id="scanner-no-cameras-panel"
                      className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[#080a0c]"
                    >
                      <div className="w-12 h-12 flex items-center justify-center border border-amber-500/40 bg-amber-500/10 text-amber-400 shrink-0">
                        <CameraOff size={24} />
                      </div>
                      <div className="space-y-1 max-w-xs">
                        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                          NO CAMERA DEVICE FOUND
                        </h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {cameraErrorInfo?.message ||
                            "No optical video camera was detected on this device. Use manual token entry to proceed."}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-xs">
                        <button
                          type="button"
                          onClick={() => startCamera(selectedCameraId || undefined)}
                          className="w-full sm:w-auto px-4 py-2.5 border border-white/20 bg-white/5 text-white hover:bg-white/10 font-mono text-xs uppercase cursor-pointer min-h-[44px]"
                        >
                          RETRY DETECTION
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchMode("manual")}
                          className="w-full sm:w-auto px-4 py-2.5 border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599]/20 font-mono text-xs uppercase font-semibold cursor-pointer min-h-[44px]"
                        >
                          USE MANUAL ENTRY
                        </button>
                      </div>
                    </div>
                  )}

                  {/* State 5: CAMERA HARDWARE BUSY (NotReadableError) */}
                  {cameraStatus === "not_readable" && (
                    <div
                      id="scanner-camera-busy-panel"
                      className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[#080a0c]"
                    >
                      <div className="w-12 h-12 flex items-center justify-center border border-amber-500/40 bg-amber-500/10 text-amber-400 shrink-0">
                        <AlertTriangle size={24} />
                      </div>
                      <div className="space-y-1 max-w-xs">
                        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                          CAMERA IN USE BY ANOTHER APP
                        </h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {cameraErrorInfo?.message ||
                            "The camera is currently locked by another application or browser tab."}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-xs">
                        <button
                          type="button"
                          onClick={() => startCamera(selectedCameraId || undefined)}
                          className="w-full sm:w-auto px-4 py-2.5 border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599]/20 font-mono text-xs uppercase font-semibold cursor-pointer min-h-[44px]"
                        >
                          TRY AGAIN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchMode("manual")}
                          className="w-full sm:w-auto px-4 py-2.5 border border-white/10 bg-white/5 text-white hover:bg-white/10 font-mono text-xs uppercase cursor-pointer min-h-[44px]"
                        >
                          MANUAL ENTRY
                        </button>
                      </div>
                    </div>
                  )}

                  {/* State 6: INSECURE CONTEXT */}
                  {cameraStatus === "insecure_context" && (
                    <div
                      id="scanner-insecure-context-panel"
                      className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[#080a0c]"
                    >
                      <div className="w-12 h-12 flex items-center justify-center border border-rose-500/40 bg-rose-500/10 text-rose-400 shrink-0">
                        <ShieldAlert size={24} />
                      </div>
                      <div className="space-y-1 max-w-xs">
                        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                          SECURE CONTEXT REQUIRED
                        </h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          Browser camera scanning requires a secure connection (HTTPS or localhost).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSwitchMode("manual")}
                        className="px-5 py-2.5 border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599]/20 font-mono text-xs uppercase font-semibold cursor-pointer min-h-[44px]"
                      >
                        CONTINUE WITH MANUAL ENTRY
                      </button>
                    </div>
                  )}

                  {/* State 7: GENERAL CAMERA ERROR */}
                  {cameraStatus === "error" && (
                    <div
                      id="scanner-general-error-panel"
                      className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[#080a0c]"
                    >
                      <div className="w-12 h-12 flex items-center justify-center border border-rose-500/40 bg-rose-500/10 text-rose-400 shrink-0">
                        <CameraOff size={24} />
                      </div>
                      <div className="space-y-1 max-w-xs">
                        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                          CAMERA STREAM ERROR
                        </h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {cameraErrorInfo?.message || "Unable to initialize optical video sensor."}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-xs">
                        <button
                          type="button"
                          onClick={() => startCamera(selectedCameraId || undefined)}
                          className="w-full sm:w-auto px-4 py-2.5 border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599]/20 font-mono text-xs uppercase font-semibold cursor-pointer min-h-[44px]"
                        >
                          TRY AGAIN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchMode("manual")}
                          className="w-full sm:w-auto px-4 py-2.5 border border-white/10 bg-white/5 text-white hover:bg-white/10 font-mono text-xs uppercase cursor-pointer min-h-[44px]"
                        >
                          MANUAL ENTRY
                        </button>
                      </div>
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
                    Type or paste the candidate&apos;s interview QR token, protocol JSON, or check-in link.
                    The server will validate candidate eligibility and securely record attendance.
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
                      placeholder='itc_qr_... OR {"protocol":"itc-interview-v1","token":"..."} OR https://...?token=...'
                      className="w-full bg-[#050708] border border-white/15 px-3 py-2.5 font-mono text-base sm:text-xs text-white placeholder-white/30 focus:border-[#00e599] focus:outline-none transition-colors"
                      disabled={isProcessing}
                    />
                    {manualInputError && (
                      <p
                        id="manual-input-error-msg"
                        className="text-xs font-mono text-rose-400 mt-1.5 flex items-center gap-1.5"
                      >
                        <AlertTriangle size={13} />
                        <span>{manualInputError}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      id="btn-manual-submit"
                      disabled={isProcessing || !manualToken.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00e599] text-[#050708] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#00ffaa] disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer min-h-[44px]"
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
                      onClick={() => {
                        setManualToken("");
                        setManualInputError(null);
                      }}
                      disabled={isProcessing || !manualToken}
                      className="px-4 py-2.5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-mono text-xs uppercase disabled:opacity-30 transition-colors cursor-pointer min-h-[44px]"
                    >
                      CLEAR
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Result Card: Renders below the viewfinder without covering navigation */}
          {result && (
            <div
              id="scanner-result-card"
              className={`border p-5 sm:p-6 transition-all animate-fadeIn ${
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
                    className={`w-10 h-10 flex items-center justify-center border shrink-0 ${
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
                  id="btn-close-result-card"
                  onClick={resumeScanning}
                  className="text-white/40 hover:text-white font-mono text-xs uppercase px-2.5 py-1.5 border border-white/10 hover:border-white/20 transition-colors min-h-[36px]"
                >
                  CLOSE
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
                  id="btn-scan-next-candidate"
                  onClick={resumeScanning}
                  className={`inline-flex items-center gap-2 px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px] ${
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
                <p className="text-[10px]">Start camera or submit a token to begin.</p>
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
            <span className="text-[10px] text-[#00e599] uppercase font-bold tracking-wider block flex items-center gap-1.5">
              <Info size={12} />
              <span>STAFF CHECK-IN GUIDELINES</span>
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
