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
  Power,
  ShieldAlert,
  Users,
  Award,
  FileText,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
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
  staffRole?: string;
}

export type ScanMode = "camera" | "manual";
export type StationMode = "check_in" | "interview_lookup";

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
  | "policy_blocked"
  | "error";

export type ResultType =
  | "success"
  | "already_checked_in"
  | "not_checked_in"
  | "lookup_success"
  | "invalid"
  | "revoked_or_expired"
  | "ineligible"
  | "network_error";

export interface CandidateInfo {
  applicationId?: string;
  applicationReference: string;
  fullName: string;
  academicId: string;
  primaryTrack: string;
  secondaryTrack?: string | null;
  academicYear: string;
  department: string;
  experienceLevel?: string;
  skills?: string | null;
  experienceDetails?: string | null;
  volunteerExperience?: string | null;
  motivation?: string;
  learningGoal?: string;
  status: string;
  checkedInAt: string;
  interviewDate?: string | null;
  interviewTime?: string | null;
  interviewLocation?: string | null;
}

export interface EvaluationInfo {
  id: string;
  applicationId: string;
  interviewerId: string;
  evaluationNotes: string;
  rating: string | null;
  recommendation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScanResultData {
  type: ResultType;
  title: string;
  message: string;
  code?: string;
  candidate?: CandidateInfo;
  checkedInAt?: string;
  recordedBy?: string;
  evaluation?: EvaluationInfo | null;
  allEvaluations?: EvaluationInfo[];
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

export default function ScannerClient({ staffEmail, staffRole = "interviewer" }: ScannerClientProps) {
  // Station Mode: Station 1 (Check-In) vs Station 2 (Interview Candidate Lookup)
  const [stationMode, setStationMode] = useState<StationMode>("check_in");
  const stationModeRef = useRef<StationMode>("check_in");

  // Keep ref synchronized for camera callbacks without stream tears
  useEffect(() => {
    stationModeRef.current = stationMode;
  }, [stationMode]);

  // Navigation & input mode
  const [mode, setMode] = useState<ScanMode>("camera");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Interview Evaluation form state (Station Two)
  const [evalNotes, setEvalNotes] = useState("");
  const [evalRating, setEvalRating] = useState<string | null>(null);
  const [evalRecommendation, setEvalRecommendation] = useState("");
  const [isSavingEval, setIsSavingEval] = useState(false);
  const [evalSaveMessage, setEvalSaveMessage] = useState<string | null>(null);
  const [evalSaveError, setEvalSaveError] = useState<string | null>(null);

  // Environment diagnostics
  const [envDiagnostic, setEnvDiagnostic] = useState<CameraEnvironmentDiagnostic | null>(null);

  // Camera states
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [cameraErrorInfo, setCameraErrorInfo] = useState<CameraErrorInfo | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [showSettingsHelp, setShowSettingsHelp] = useState(false);

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
        } else if (!diag.isPermissionsPolicyAllowed) {
          setCameraStatus("policy_blocked");
          setCameraErrorInfo(
            classifyCameraError(
              new Error("Camera access is disallowed by Permissions Policy header.")
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

  // Submit token to server check-in or interview lookup API based on current station mode
  const processCheckIn = useCallback(
    async (rawPayload: string) => {
      if (isProcessingRef.current || hasResultRef.current) return;

      const token = parseClientQrPayload(rawPayload);
      if (!token) {
        return;
      }

      isProcessingRef.current = true;
      setIsProcessing(true);
      const currentStation = stationModeRef.current;

      try {
        const endpoint =
          currentStation === "check_in"
            ? "/api/admin/interviews/check-in"
            : "/api/admin/interviews/lookup";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        // Station 1: Attendance Check-In Success (HTTP 200)
        if (currentStation === "check_in" && response.status === 200 && data.ok) {
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

        // Station 2: Interview Lookup Success (HTTP 200)
        if (currentStation === "interview_lookup" && response.status === 200 && data.ok) {
          hasResultRef.current = true;
          const candidate = data.candidate as CandidateInfo;

          if (soundEnabled) playFeedbackSound("success");
          triggerHaptic("success");

          // Pre-populate evaluation form
          setEvalNotes(data.evaluation?.evaluationNotes || "");
          setEvalRating(data.evaluation?.rating || null);
          setEvalRecommendation(data.evaluation?.recommendation || "");
          setEvalSaveMessage(null);
          setEvalSaveError(null);

          const resultPayload: ScanResultData = {
            type: "lookup_success",
            title: "CANDIDATE VERIFIED FOR INTERVIEW",
            message: "Candidate attendance verified. Interview evaluation form ready.",
            code: "LOOKUP_SUCCESS",
            candidate,
            checkedInAt: candidate.checkedInAt,
            evaluation: data.evaluation || null,
            allEvaluations: data.allEvaluations || undefined,
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

        // Station 2: Candidate has not checked in at Station 1 yet (HTTP 409 NOT_CHECKED_IN)
        if (response.status === 409 && data.code === "NOT_CHECKED_IN") {
          hasResultRef.current = true;
          if (soundEnabled) playFeedbackSound("duplicate");
          triggerHaptic("duplicate");

          setResult({
            type: "not_checked_in",
            title: "CANDIDATE NOT CHECKED IN YET",
            message:
              data.error ||
              "Candidate has not completed check-in at Station 1 yet. Attendance check-in is required before starting the interview.",
            code: "NOT_CHECKED_IN",
          });
          setStats((prev) => ({ ...prev, total: prev.total + 1, rejected: prev.rejected + 1 }));
          return;
        }

        // Station 1: Already checked in (HTTP 409)
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

        // Invalid token (HTTP 404)
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

        // Revoked or Expired token (HTTP 400)
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

        // Ineligible status (HTTP 400)
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

        // Generic error
        hasResultRef.current = true;
        if (soundEnabled) playFeedbackSound("error");
        triggerHaptic("error");

        setResult({
          type: "network_error",
          title: "SCANNER ERROR",
          message: data.error || "Unable to complete request.",
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

      if (!diag.isPermissionsPolicyAllowed) {
        isStartingRef.current = false;
        setCameraStatus("policy_blocked");
        setCameraErrorInfo(
          classifyCameraError(
            new Error("Camera access is disallowed by Permissions Policy header.")
          )
        );
        return;
      }

      try {
        await stopCamera();

        // 1. Invoke initial getUserMedia request directly inside the user's camera-start interaction
        // Use a suitable initial constraint without requiring a specific resolution, device label, or camera ID
        let initialStream: MediaStream | null = null;
        try {
          initialStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
            },
            audio: false,
          });
        } finally {
          // Immediately release the initial stream tracks so it doesn't lock hardware or compete with html5-qrcode
          if (initialStream) {
            initialStream.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch {
                // ignore
              }
            });
          }
        }

        if (!isMountedRef.current) {
          isStartingRef.current = false;
          return;
        }

        // 2. Enumerate available video devices now that permission has been granted
        let cameras: Array<{ id: string; label: string }> = [];
        try {
          cameras = await Html5Qrcode.getCameras();
          if (isMountedRef.current && cameras.length > 0) {
            setAvailableCameras(cameras);
          }
        } catch (camErr) {
          console.warn("[scanner] Failed to enumerate cameras after permission grant:", camErr);
        }

        if (!isMountedRef.current) {
          isStartingRef.current = false;
          return;
        }

        const scanner = new Html5Qrcode(containerId);
        html5QrCodeRef.current = scanner;

        // Config priority:
        // 1. Explicit cameraId selected by staff
        // 2. If availableCameras has a rear/back labeled camera, use its deviceId
        // 3. Mobile rear camera { facingMode: "environment" }
        // 4. Fallback to first enumerated camera id
        let cameraConfig: string | { deviceId: { exact: string } } | { facingMode: string } = {
          facingMode: "environment",
        };

        if (cameraId) {
          cameraConfig = { deviceId: { exact: cameraId } };
        } else {
          const rearCam = cameras.find((c) =>
            /back|rear|environment/i.test(c.label)
          );
          if (rearCam) {
            cameraConfig = { deviceId: { exact: rearCam.id } };
            setSelectedCameraId(rearCam.id);
          } else {
            cameraConfig = { facingMode: "environment" };
          }
        }

        const scannerConfig = {
          fps: 12,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
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
          const classified = classifyCameraError(initialErr);
          // Only retry with generic fallback if constraint or device error occurred, NEVER on permission denial!
          if (classified.code === "overconstrained" || classified.code === "not_found") {
            console.info("[scanner] Retrying with generic camera constraints...");
            const fallbackTarget =
              cameras.length > 0 ? cameras[0].id : { facingMode: "user" };
            await scanner.start(
              fallbackTarget,
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
          setCameraErrorInfo(null);
          setShowSettingsHelp(false);

          // Re-enumerate cameras to ensure any remaining labels are fresh
          try {
            const refreshedCameras = await Html5Qrcode.getCameras();
            if (isMountedRef.current && refreshedCameras.length > 0) {
              setAvailableCameras(refreshedCameras);
            }
          } catch {
            // ignore
          }
        }
      } catch (err: unknown) {
        if (!isMountedRef.current) return;

        // Clean up scanner on failure
        await stopCamera();

        const info = classifyCameraError(err);
        setCameraErrorInfo(info);

        if (info.isExpectedDenial) {
          console.info(
            "[scanner] Camera permission denied by user or browser policy:",
            info.message
          );
          setCameraStatus("permission_denied");
        } else if (info.code === "policy_blocked") {
          console.warn("[scanner] Camera blocked by Permissions-Policy:", info.message);
          setCameraStatus("policy_blocked");
        } else if (info.code === "not_found") {
          console.warn("[scanner] No camera hardware found:", info.message);
          setCameraStatus("no_cameras");
        } else if (info.code === "not_readable") {
          console.warn("[scanner] Camera hardware locked or in use:", info.message);
          setCameraStatus("not_readable");
        } else if (info.code === "overconstrained") {
          console.warn("[scanner] Camera constraints unsupported:", info.message);
          setCameraStatus("overconstrained");
        } else if (info.code === "insecure_context") {
          console.warn("[scanner] Insecure context:", info.message);
          setCameraStatus("insecure_context");
        } else {
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
    setEvalNotes("");
    setEvalRating(null);
    setEvalRecommendation("");
    setEvalSaveMessage(null);
    setEvalSaveError(null);
  }, []);

  // Keyboard shortcut: Press Space, Enter, or Escape to dismiss result and scan next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") {
        return;
      }
      if (result && (e.key === "Enter" || e.key === " " || e.key === "Escape")) {
        e.preventDefault();
        resumeScanning();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [result, resumeScanning]);

  // Handle saving interview evaluation
  const handleSaveEvaluation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!result?.candidate?.applicationId) return;

    setIsSavingEval(true);
    setEvalSaveMessage(null);
    setEvalSaveError(null);

    try {
      const response = await fetch("/api/admin/interviews/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: result.candidate.applicationId,
          evaluationNotes: evalNotes,
          rating: evalRating,
          recommendation: evalRecommendation,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setEvalSaveError(data.error || "Failed to save evaluation.");
        if (soundEnabled) playFeedbackSound("error");
      } else {
        setEvalSaveMessage(`Saved at ${new Date().toLocaleTimeString("en-GB")}`);
        if (soundEnabled) playFeedbackSound("success");
      }
    } catch (err) {
      setEvalSaveError(err instanceof Error ? err.message : "Network communication error.");
      if (soundEnabled) playFeedbackSound("error");
    } finally {
      setIsSavingEval(false);
    }
  };

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
      {/* Station Selector Bar: Station 1 (Check-In) vs Station 2 (Interview Lookup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-white/10 bg-[#080a0c] p-3">
        <button
          type="button"
          id="station-mode-checkin"
          onClick={() => {
            setStationMode("check_in");
            setResult(null);
            hasResultRef.current = false;
          }}
          className={`p-3 text-left border transition-all cursor-pointer ${
            stationMode === "check_in"
              ? "border-[#00e599] bg-[#00e599]/10 shadow-[0_0_15px_rgba(0,229,153,0.15)]"
              : "border-white/10 hover:border-white/20 bg-white/[0.02]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <CheckCircle2 size={16} className={stationMode === "check_in" ? "text-[#00e599]" : "text-white/40"} />
              <span>Station 1: Attendance Check-In</span>
            </span>
            {stationMode === "check_in" && (
              <span className="text-[10px] font-mono px-2 py-0.5 border border-[#00e599]/40 bg-[#00e599]/20 text-[#00e599] uppercase font-bold">
                Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/50 mt-1 font-mono">
            Record candidate attendance once with atomic duplicate detection.
          </p>
        </button>

        <button
          type="button"
          id="station-mode-lookup"
          onClick={() => {
            setStationMode("interview_lookup");
            setResult(null);
            hasResultRef.current = false;
          }}
          className={`p-3 text-left border transition-all cursor-pointer ${
            stationMode === "interview_lookup"
              ? "border-[#38bdf8] bg-[#38bdf8]/10 shadow-[0_0_15px_rgba(56,189,248,0.15)]"
              : "border-white/10 hover:border-white/20 bg-white/[0.02]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Users size={16} className={stationMode === "interview_lookup" ? "text-[#38bdf8]" : "text-white/40"} />
              <span>Station 2: Interview Candidate Lookup</span>
            </span>
            {stationMode === "interview_lookup" && (
              <span className="text-[10px] font-mono px-2 py-0.5 border border-[#38bdf8]/40 bg-[#38bdf8]/20 text-[#38bdf8] uppercase font-bold">
                Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/50 mt-1 font-mono">
            Inspect verified candidate interview profile and record evaluation notes.
          </p>
        </button>
      </div>

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
                          : cameraStatus === "permission_denied" || cameraStatus === "policy_blocked" || cameraStatus === "error"
                          ? "bg-rose-500"
                          : cameraStatus === "no_cameras" || cameraStatus === "not_readable" || cameraStatus === "overconstrained"
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
                        : cameraStatus === "policy_blocked"
                        ? "BLOCKED BY PERMISSIONS POLICY"
                        : cameraStatus === "no_cameras"
                        ? "NO CAMERA FOUND"
                        : cameraStatus === "not_readable"
                        ? "CAMERA HARDWARE BUSY"
                        : cameraStatus === "overconstrained"
                        ? "CONSTRAINTS UNSUPPORTED"
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

                  {/* State 3: PERMISSION DENIED (Comprehensive Mobile Instructions + Camera Settings Help + Try Again + Manual Entry) */}
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

                      {/* Expandable Camera Settings Help */}
                      <div className="w-full max-w-sm text-left">
                        <button
                          type="button"
                          id="btn-camera-settings-help"
                          onClick={() => setShowSettingsHelp(!showSettingsHelp)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#050708] border border-white/10 hover:border-[#00e599]/40 text-left transition-colors font-mono text-xs text-[#00e599] cursor-pointer"
                        >
                          <span className="flex items-center gap-2 font-bold uppercase text-[11px]">
                            <Sliders size={13} />
                            <span>CAMERA SETTINGS HELP</span>
                          </span>
                          {showSettingsHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {showSettingsHelp && (
                          <div
                            id="camera-settings-help-content"
                            className="p-3.5 bg-[#050708] border-x border-b border-white/10 space-y-3 text-[11px] font-mono text-white/70 leading-relaxed max-h-60 overflow-y-auto"
                          >
                            <div className="space-y-1">
                              <span className="text-[#00e599] font-bold block uppercase text-[10px]">
                                • Mobile Chrome (Android &amp; iOS):
                              </span>
                              <p className="text-white/60">
                                1. Tap the page controls icon (tune / sliders or lock icon) beside the address bar, or tap menu (⋮) &gt; Settings &gt; Site settings &gt; Camera.
                              </p>
                              <p className="text-white/60">
                                2. Set Camera to <strong>Allow</strong> for this site.
                              </p>
                              <p className="text-white/60">
                                3. <strong>Android System Permission:</strong> If Chrome lacks device permission, open Android Settings &gt; Apps &gt; Chrome &gt; Permissions &gt; Camera &gt; select &quot;Allow only while using the app&quot;.
                              </p>
                            </div>

                            <div className="space-y-1 pt-1 border-t border-white/10">
                              <span className="text-[#00e599] font-bold block uppercase text-[10px]">
                                • Mobile Safari (iOS):
                              </span>
                              <p className="text-white/60">
                                1. Tap the <strong>aA</strong> or page settings icon in the address bar &gt; Website Settings &gt; Camera &gt; <strong>Allow</strong>.
                              </p>
                              <p className="text-white/60">
                                2. In iOS Settings: open Settings &gt; Safari &gt; Camera &gt; set to <strong>Ask</strong> or <strong>Allow</strong>.
                              </p>
                            </div>

                            <div className="space-y-1 pt-1 border-t border-white/10">
                              <span className="text-[#00e599] font-bold block uppercase text-[10px]">
                                • Desktop Chrome / Edge / Brave:
                              </span>
                              <p className="text-white/60">
                                Click the site controls icon beside the URL in the address bar and switch Camera to <strong>Allow</strong>.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Working camera selector if multiple sensors enumerated */}
                      {availableCameras.length > 1 && (
                        <div className="w-full max-w-sm flex items-center gap-2">
                          <label htmlFor="recovery-camera-select" className="text-[10px] font-mono text-white/50 uppercase whitespace-nowrap">
                            CHOOSE CAMERA:
                          </label>
                          <select
                            id="recovery-camera-select"
                            value={selectedCameraId}
                            onChange={(e) => {
                              setSelectedCameraId(e.target.value);
                              startCamera(e.target.value);
                            }}
                            className="w-full bg-[#050708] border border-white/15 text-xs font-mono text-white/90 px-2 py-1.5 focus:border-[#00e599] focus:outline-none"
                          >
                            <option value="">Default (Rear Camera)</option>
                            {availableCameras.map((cam, idx) => (
                              <option key={cam.id} value={cam.id}>
                                {cam.label || `Camera ${idx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Primary Actions: Try Again + Manual Entry */}
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

                  {/* State 3b: POLICY BLOCKED */}
                  {cameraStatus === "policy_blocked" && (
                    <div
                      id="scanner-policy-blocked-panel"
                      className="absolute inset-0 p-5 sm:p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[#080a0c] overflow-y-auto"
                    >
                      <div className="w-12 h-12 flex items-center justify-center border border-rose-500/40 bg-rose-500/10 text-rose-400 shrink-0">
                        <ShieldAlert size={24} />
                      </div>

                      <div className="space-y-1.5 max-w-sm">
                        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                          CAMERA BLOCKED BY POLICY
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                          {cameraErrorInfo?.message ||
                            "Camera access is restricted by the website's Permissions-Policy header."}
                        </p>
                      </div>

                      <div className="w-full max-w-sm bg-[#050708] border border-white/10 p-3 text-left space-y-1.5 text-[11px] font-mono text-white/60">
                        <span className="text-[#00e599] font-bold block uppercase text-[10px]">
                          SECURITY POLICY INSTRUCTIONS:
                        </span>
                        <p>1. The Permissions-Policy response header must specify camera=(self).</p>
                        <p>2. If embedded in an iframe, the frame must include allow=&quot;camera&quot;.</p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full max-w-sm">
                        <button
                          type="button"
                          onClick={() => startCamera(selectedCameraId || undefined)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599]/20 font-mono text-xs uppercase font-semibold cursor-pointer min-h-[44px]"
                        >
                          <RefreshCw size={13} />
                          <span>RETRY DETECTION</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchMode("manual")}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-white/15 bg-white/5 text-white hover:bg-white/10 font-mono text-xs uppercase cursor-pointer min-h-[44px]"
                        >
                          <Keyboard size={13} />
                          <span>ENTER TOKEN MANUALLY</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* State 3c: OVERCONSTRAINED */}
                  {cameraStatus === "overconstrained" && (
                    <div
                      id="scanner-overconstrained-panel"
                      className="absolute inset-0 p-5 sm:p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[#080a0c] overflow-y-auto"
                    >
                      <div className="w-12 h-12 flex items-center justify-center border border-amber-500/40 bg-amber-500/10 text-amber-400 shrink-0">
                        <CameraOff size={24} />
                      </div>

                      <div className="space-y-1.5 max-w-sm">
                        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                          CAMERA CONSTRAINTS UNSUPPORTED
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                          {cameraErrorInfo?.message ||
                            "The requested camera sensor could not be started with the current constraints."}
                        </p>
                      </div>

                      {availableCameras.length > 1 && (
                        <div className="w-full max-w-sm flex items-center gap-2">
                          <label htmlFor="overconstrained-camera-select" className="text-[10px] font-mono text-white/50 uppercase whitespace-nowrap">
                            CHOOSE CAMERA:
                          </label>
                          <select
                            id="overconstrained-camera-select"
                            value={selectedCameraId}
                            onChange={(e) => {
                              setSelectedCameraId(e.target.value);
                              startCamera(e.target.value);
                            }}
                            className="w-full bg-[#050708] border border-white/15 text-xs font-mono text-white/90 px-2 py-1.5 focus:border-[#00e599] focus:outline-none"
                          >
                            <option value="">Default (Rear Camera)</option>
                            {availableCameras.map((cam, idx) => (
                              <option key={cam.id} value={cam.id}>
                                {cam.label || `Camera ${idx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full max-w-sm">
                        <button
                          type="button"
                          onClick={() => startCamera(selectedCameraId || undefined)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] hover:bg-[#00e599]/20 font-mono text-xs uppercase font-semibold cursor-pointer min-h-[44px]"
                        >
                          <RefreshCw size={13} />
                          <span>TRY AGAIN</span>
                        </button>
                        <button
                          type="button"
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
                  : result.type === "lookup_success"
                  ? "border-[#38bdf8]/60 bg-[#38bdf8]/[0.05]"
                  : result.type === "already_checked_in" || result.type === "not_checked_in"
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
                        : result.type === "lookup_success"
                        ? "border-[#38bdf8]/60 bg-[#38bdf8]/20 text-[#38bdf8]"
                        : result.type === "already_checked_in" || result.type === "not_checked_in"
                        ? "border-amber-500/60 bg-amber-500/20 text-amber-400"
                        : "border-rose-500/60 bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {result.type === "success" && <CheckCircle2 size={20} />}
                    {result.type === "lookup_success" && <Users size={20} />}
                    {(result.type === "already_checked_in" || result.type === "not_checked_in") && (
                      <AlertTriangle size={20} />
                    )}
                    {result.type !== "success" &&
                      result.type !== "lookup_success" &&
                      result.type !== "already_checked_in" &&
                      result.type !== "not_checked_in" && <XCircle size={20} />}
                  </div>

                  <div>
                    <span
                      className={`font-mono text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border ${
                        result.type === "success"
                          ? "border-[#00e599]/40 bg-[#00e599]/15 text-[#00e599]"
                          : result.type === "lookup_success"
                          ? "border-[#38bdf8]/40 bg-[#38bdf8]/15 text-[#38bdf8]"
                          : result.type === "already_checked_in" || result.type === "not_checked_in"
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
                      <div className="flex items-center gap-1.5">
                        {getTrackBadge(result.candidate.primaryTrack)}
                        {result.candidate.secondaryTrack && (
                          <span className="text-[10px] font-mono px-2 py-0.5 border border-white/15 bg-white/5 text-white/60 uppercase">
                            2ND: {result.candidate.secondaryTrack}
                          </span>
                        )}
                      </div>
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
                        {result.type === "success"
                          ? "CHECKED IN AT:"
                          : "ATTENDANCE TIMESTAMP:"}{" "}
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

                  {/* Station Two: Interview Profile & Dedicated Evaluation Form */}
                  {result.type === "lookup_success" && (
                    <div className="border-t border-white/10 pt-4 space-y-4">
                      {/* Interview Extended Details */}
                      {(result.candidate.skills ||
                        result.candidate.motivation ||
                        result.candidate.learningGoal ||
                        result.candidate.experienceDetails) && (
                        <div className="bg-[#050708] border border-white/10 p-4 space-y-3 text-xs">
                          <div className="flex items-center gap-2 text-white/50 font-mono text-[11px] uppercase">
                            <FileText size={14} className="text-[#38bdf8]" />
                            <span className="font-bold text-white">Interview Profile Details</span>
                          </div>

                          {result.candidate.skills && (
                            <div className="pt-2 border-t border-white/5">
                              <span className="font-mono text-[10px] text-white/40 uppercase block">
                                Technical Skills
                              </span>
                              <p className="text-white/80 mt-1 leading-relaxed">
                                {result.candidate.skills}
                              </p>
                            </div>
                          )}

                          {result.candidate.motivation && (
                            <div className="pt-2 border-t border-white/5">
                              <span className="font-mono text-[10px] text-white/40 uppercase block">
                                Candidate Motivation
                              </span>
                              <p className="text-white/80 mt-1 leading-relaxed text-[11px]">
                                {result.candidate.motivation}
                              </p>
                            </div>
                          )}

                          {result.candidate.learningGoal && (
                            <div className="pt-2 border-t border-white/5">
                              <span className="font-mono text-[10px] text-white/40 uppercase block">
                                Learning Goals
                              </span>
                              <p className="text-white/80 mt-1 leading-relaxed text-[11px]">
                                {result.candidate.learningGoal}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Evaluation Form */}
                      <form
                        onSubmit={handleSaveEvaluation}
                        className="bg-[#050708] border border-[#38bdf8]/40 p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-2">
                            <Award size={15} />
                            <span>Interviewer Evaluation &amp; Notes</span>
                          </span>
                          <span className="font-mono text-[10px] text-white/40">
                            Attributed to: {staffEmail} ({staffRole})
                          </span>
                        </div>

                        {/* Predefined Ratings */}
                        <div>
                          <label className="block font-mono text-[10px] text-white/60 uppercase tracking-wider mb-2">
                            Candidate Assessment Rating
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(
                              [
                                {
                                  value: "STRONG_HIRE",
                                  label: "Strong Hire",
                                  color: "border-emerald-500 text-emerald-400 bg-emerald-500/10",
                                },
                                {
                                  value: "HIRE",
                                  label: "Hire",
                                  color: "border-teal-500 text-teal-300 bg-teal-500/10",
                                },
                                {
                                  value: "NEUTRAL",
                                  label: "Neutral",
                                  color: "border-amber-500 text-amber-300 bg-amber-500/10",
                                },
                                {
                                  value: "NO_HIRE",
                                  label: "No Hire",
                                  color: "border-rose-500 text-rose-400 bg-rose-500/10",
                                },
                              ] as const
                            ).map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => setEvalRating(item.value)}
                                className={`py-2 px-3 border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                                  evalRating === item.value
                                    ? `${item.color} shadow-sm ring-1 ring-white/20`
                                    : "border-white/10 text-white/40 hover:text-white hover:border-white/25"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Evaluation Notes */}
                        <div>
                          <label
                            htmlFor="eval-notes-input"
                            className="block font-mono text-[10px] text-white/60 uppercase tracking-wider mb-1.5"
                          >
                            Evaluation Notes &amp; Observations
                          </label>
                          <textarea
                            id="eval-notes-input"
                            rows={4}
                            value={evalNotes}
                            onChange={(e) => setEvalNotes(e.target.value)}
                            placeholder="Enter evaluation notes regarding technical problem solving, teamwork, communication, strengths, and fit for the track..."
                            className="w-full bg-[#080a0c] border border-white/15 px-3 py-2 text-xs text-white placeholder-white/25 focus:border-[#38bdf8] focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Recommendation */}
                        <div>
                          <label
                            htmlFor="eval-recommendation-input"
                            className="block font-mono text-[10px] text-white/60 uppercase tracking-wider mb-1.5"
                          >
                            Recommended Role or Focus (Optional)
                          </label>
                          <input
                            id="eval-recommendation-input"
                            type="text"
                            value={evalRecommendation}
                            onChange={(e) => setEvalRecommendation(e.target.value)}
                            placeholder="e.g. Recommended for Technical Workshop Mentor"
                            className="w-full bg-[#080a0c] border border-white/15 px-3 py-2 text-xs text-white placeholder-white/25 focus:border-[#38bdf8] focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Form Submission */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <button
                            type="submit"
                            id="btn-save-evaluation"
                            disabled={isSavingEval}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#38bdf8] text-[#050708] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#60a5fa] disabled:opacity-50 transition-colors cursor-pointer min-h-[40px]"
                          >
                            {isSavingEval ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>SAVING EVALUATION...</span>
                              </>
                            ) : (
                              <>
                                <Save size={13} />
                                <span>SAVE EVALUATION</span>
                              </>
                            )}
                          </button>

                          {evalSaveMessage && (
                            <span className="text-xs font-mono text-[#00e599] flex items-center gap-1.5 animate-fadeIn">
                              <Check size={14} />
                              <span>{evalSaveMessage}</span>
                            </span>
                          )}

                          {evalSaveError && (
                            <span className="text-xs font-mono text-rose-400 flex items-center gap-1.5 animate-fadeIn">
                              <AlertTriangle size={14} />
                              <span>{evalSaveError}</span>
                            </span>
                          )}
                        </div>

                        {/* Committee Review Roster (Only for owner/admin with other evaluations) */}
                        {result.allEvaluations && result.allEvaluations.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                            <p className="font-mono text-[11px] font-bold uppercase text-white/50 tracking-wider">
                              All Committee Evaluations ({result.allEvaluations.length})
                            </p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {result.allEvaluations.map((ev) => (
                                <div
                                  key={ev.id}
                                  className="border border-white/10 bg-[#080a0c] p-2.5 text-xs font-mono space-y-1"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-white/40">
                                    <span>INTERVIEWER ID: {ev.interviewerId}</span>
                                    <span className="font-bold text-white">
                                      {ev.rating || "NO RATING"}
                                    </span>
                                  </div>
                                  {ev.evaluationNotes && (
                                    <p className="text-white/80 text-[11px] whitespace-pre-wrap">
                                      {ev.evaluationNotes}
                                    </p>
                                  )}
                                  {ev.recommendation && (
                                    <p className="text-[#38bdf8] text-[10px]">
                                      Fit: {ev.recommendation}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </form>
                    </div>
                  )}
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
                      : result.type === "lookup_success"
                      ? "bg-[#38bdf8] text-[#050708] hover:bg-[#60a5fa]"
                      : result.type === "already_checked_in" || result.type === "not_checked_in"
                      ? "bg-amber-400 text-[#050708] hover:bg-amber-300"
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                  }`}
                >
                  <span>
                    {result.type === "success" || result.type === "lookup_success"
                      ? "SCAN NEXT CANDIDATE (SPACE)"
                      : result.type === "already_checked_in"
                      ? "DISMISS & CONTINUE (SPACE)"
                      : "RETRY / SCAN NEXT"}
                  </span>
                  <ArrowRight size={14} />
                </button>

                {/* Seamless transitions between stations */}
                {result.type === "not_checked_in" && (
                  <button
                    type="button"
                    onClick={() => {
                      setStationMode("check_in");
                      resumeScanning();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-3 border border-[#00e599] bg-[#00e599]/10 text-[#00e599] font-mono text-xs uppercase font-bold hover:bg-[#00e599]/20 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <span>SWITCH TO STATION 1 (CHECK-IN)</span>
                  </button>
                )}

                {result.type === "already_checked_in" && stationMode === "check_in" && (
                  <button
                    type="button"
                    onClick={() => {
                      setStationMode("interview_lookup");
                      resumeScanning();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-3 border border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8] font-mono text-xs uppercase font-bold hover:bg-[#38bdf8]/20 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <span>OPEN IN STATION 2 (INTERVIEW LOOKUP)</span>
                  </button>
                )}
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
