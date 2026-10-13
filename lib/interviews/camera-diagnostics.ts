/**
/**
 * Camera Diagnostic and Error Classification Utilities.
 * Client-safe, zero external dependencies, robustly testable in Node and Browser environments.
 */

export type CameraErrorCode =
  | "not_allowed"
  | "not_found"
  | "not_readable"
  | "overconstrained"
  | "insecure_context"
  | "unsupported"
  | "unknown";

export interface CameraErrorInfo {
  code: CameraErrorCode;
  title: string;
  message: string;
  instructions: string[];
  canRetry: boolean;
  fallbackToManual: boolean;
  isExpectedDenial: boolean;
}

export interface CameraEnvironmentDiagnostic {
  isSecureContext: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  permissionState: "granted" | "denied" | "prompt" | "unsupported";
  isSupported: boolean;
  diagnosticMessage: string;
}

/**
 * Inspect the current runtime environment for camera scanning support.
 * Works safely in both browser and mock/Node environments without throwing.
 */
export async function diagnoseCameraEnvironment(
  runtimeContext?: {
    nav?: Partial<Navigator>;
    isSecure?: boolean;
    win?: Partial<Window>;
  }
): Promise<CameraEnvironmentDiagnostic> {
  const nav = runtimeContext?.nav ?? (typeof navigator !== "undefined" ? navigator : undefined);
  const win = runtimeContext?.win ?? (typeof window !== "undefined" ? window : undefined);

  // Secure context detection (HTTPS, localhost, 127.0.0.1)
  let isSecureContext = false;
  if (runtimeContext?.isSecure !== undefined) {
    isSecureContext = runtimeContext.isSecure;
  } else if (win) {
    if (typeof win.isSecureContext === "boolean") {
      isSecureContext = win.isSecureContext;
    } else if (win.location) {
      const hostname = win.location.hostname || "";
      const protocol = win.location.protocol || "";
      isSecureContext =
        protocol === "https:" ||
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "[::1]";
    }
  }

  const hasMediaDevices = Boolean(nav && "mediaDevices" in nav && nav.mediaDevices);
  const hasGetUserMedia = Boolean(
    hasMediaDevices &&
      nav?.mediaDevices &&
      typeof nav.mediaDevices.getUserMedia === "function"
  );

  let permissionState: "granted" | "denied" | "prompt" | "unsupported" = "unsupported";

  if (nav && "permissions" in nav && nav.permissions && typeof nav.permissions.query === "function") {
    try {
      // Note: Not all browsers support querying camera permission (e.g. Safari / Firefox throw or reject)
      const status = await nav.permissions.query({ name: "camera" as PermissionName });
      if (status && (status.state === "granted" || status.state === "denied" || status.state === "prompt")) {
        permissionState = status.state;
      }
    } catch {
      permissionState = "unsupported";
    }
  }

  const isSupported = isSecureContext && hasGetUserMedia;

  let diagnosticMessage = "Camera scanning environment ready.";
  if (!isSecureContext) {
    diagnosticMessage = "Camera access requires a secure context (HTTPS or localhost).";
  } else if (!hasMediaDevices || !hasGetUserMedia) {
    diagnosticMessage = "Your browser does not support optical video capture APIs.";
  } else if (permissionState === "denied") {
    diagnosticMessage = "Camera permission has previously been denied in this browser.";
  }

  return {
    isSecureContext,
    hasMediaDevices,
    hasGetUserMedia,
    permissionState,
    isSupported,
    diagnosticMessage,
  };
}

/**
 * Classify camera startup and stream errors into actionable user feedback.
 */
export function classifyCameraError(err: unknown): CameraErrorInfo {
  if (!err) {
    return {
      code: "unknown",
      title: "Unknown Camera Error",
      message: "An unknown camera error occurred.",
      instructions: ["Please retry or use manual token entry."],
      canRetry: true,
      fallbackToManual: true,
      isExpectedDenial: false,
    };
  }

  const errName = (typeof err === "object" && err !== null && "name" in err)
    ? String((err as { name: unknown }).name)
    : "";
  const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();

  // 1. NotAllowedError / Permission Denied
  if (
    errName === "NotAllowedError" ||
    errName === "PermissionDeniedError" ||
    errMsg.includes("permission denied") ||
    errMsg.includes("notallowederror") ||
    errMsg.includes("permission dismissed") ||
    errMsg.includes("denied by system")
  ) {
    return {
      code: "not_allowed",
      title: "Camera Permission Denied",
      message: "Camera access was denied by your browser or operating system settings.",
      instructions: [
        "Click the camera/lock icon in your browser address bar.",
        "Change Camera permission from 'Block' to 'Allow'.",
        "Click 'Try Again' or reload this page to activate optical scanning.",
      ],
      canRetry: true,
      fallbackToManual: true,
      isExpectedDenial: true,
    };
  }

  // 2. NotFoundError / DevicesNotFoundError
  if (
    errName === "NotFoundError" ||
    errName === "DevicesNotFoundError" ||
    errMsg.includes("notfounderror") ||
    errMsg.includes("requested device not found") ||
    errMsg.includes("no camera") ||
    errMsg.includes("no video input devices")
  ) {
    return {
      code: "not_found",
      title: "No Camera Hardware Found",
      message: "No compatible optical camera was detected on this device or system.",
      instructions: [
        "Check that your webcam or phone camera is connected and recognized.",
        "Ensure no hardware privacy switch is disabling the optical sensor.",
        "Use manual token entry below to check in the candidate immediately.",
      ],
      canRetry: true,
      fallbackToManual: true,
      isExpectedDenial: false,
    };
  }

  // 3. NotReadableError / TrackStartError
  if (
    errName === "NotReadableError" ||
    errName === "TrackStartError" ||
    errMsg.includes("notreadableerror") ||
    errMsg.includes("could not start video source") ||
    errMsg.includes("hardware error") ||
    errMsg.includes("device is busy")
  ) {
    return {
      code: "not_readable",
      title: "Camera Hardware In Use",
      message: "The camera is currently locked or being used by another application or browser tab.",
      instructions: [
        "Close other apps that may be using video (Zoom, Microsoft Teams, Google Meet, OBS).",
        "Check if another browser tab is currently streaming from the camera.",
        "Click 'Try Again' once the camera hardware has been released.",
      ],
      canRetry: true,
      fallbackToManual: true,
      isExpectedDenial: false,
    };
  }

  // 4. OverconstrainedError / ConstraintNotSatisfiedError
  if (
    errName === "OverconstrainedError" ||
    errName === "ConstraintNotSatisfiedError" ||
    errMsg.includes("overconstrainederror") ||
    errMsg.includes("constraints could not be satisfied")
  ) {
    return {
      code: "overconstrained",
      title: "Camera Constraints Unsupported",
      message: "The requested camera specifications (e.g. rear environment sensor) are unavailable on this device.",
      instructions: [
        "Switch to another available camera from the camera selector dropdown.",
        "Click 'Try Again' to scan using default camera settings.",
      ],
      canRetry: true,
      fallbackToManual: true,
      isExpectedDenial: false,
    };
  }

  // 5. Insecure Context or Incompatible Browser
  if (
    errName === "SecurityError" ||
    errMsg.includes("insecure context") ||
    errMsg.includes("https") ||
    errMsg.includes("only supported in secure context")
  ) {
    return {
      code: "insecure_context",
      title: "Secure Context Required",
      message: "Web camera scanning requires a secure connection (HTTPS) or local development (localhost).",
      instructions: [
        "Access the administrative portal using HTTPS.",
        "If testing locally, use http://localhost:3000.",
        "Use manual token entry below for check-in on this network.",
      ],
      canRetry: false,
      fallbackToManual: true,
      isExpectedDenial: false,
    };
  }

  // 6. Generic or Unknown Error
  const safeMessage = err instanceof Error ? err.message : String(err);
  return {
    code: "unknown",
    title: "Camera Initialization Failed",
    message: safeMessage ? `Camera error: ${safeMessage}` : "Unable to start optical scanner.",
    instructions: [
      "Check that your browser is up to date and has permission to access media devices.",
      "Click 'Try Again' or switch to manual token entry.",
    ],
    canRetry: true,
    fallbackToManual: true,
    isExpectedDenial: false,
  };
}
