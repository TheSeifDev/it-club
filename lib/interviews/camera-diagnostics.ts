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
  | "policy_blocked"
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
  isPermissionsPolicyAllowed: boolean;
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
    doc?: {
      permissionsPolicy?: { allowsFeature?: (feature: string) => boolean };
      featurePolicy?: { allowsFeature?: (feature: string) => boolean };
    };
  }
): Promise<CameraEnvironmentDiagnostic> {
  const nav = runtimeContext?.nav ?? (typeof navigator !== "undefined" ? navigator : undefined);
  const win = runtimeContext?.win ?? (typeof window !== "undefined" ? window : undefined);
  const doc = runtimeContext?.doc ?? (typeof document !== "undefined" ? document : undefined);

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

  // Permissions-Policy inspection via standard Document API
  let isPermissionsPolicyAllowed = true;
  if (doc) {
    const docWithPolicy = doc as unknown as {
      permissionsPolicy?: { allowsFeature?: (feature: string) => boolean };
      featurePolicy?: { allowsFeature?: (feature: string) => boolean };
    };
    if (docWithPolicy.permissionsPolicy && typeof docWithPolicy.permissionsPolicy.allowsFeature === "function") {
      try {
        isPermissionsPolicyAllowed = docWithPolicy.permissionsPolicy.allowsFeature("camera");
      } catch {
        isPermissionsPolicyAllowed = true;
      }
    } else if (docWithPolicy.featurePolicy && typeof docWithPolicy.featurePolicy.allowsFeature === "function") {
      try {
        isPermissionsPolicyAllowed = docWithPolicy.featurePolicy.allowsFeature("camera");
      } catch {
        isPermissionsPolicyAllowed = true;
      }
    }
  }

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

  const isSupported = isSecureContext && hasGetUserMedia && isPermissionsPolicyAllowed;

  let diagnosticMessage = "Camera scanning environment ready.";
  if (!isSecureContext) {
    diagnosticMessage = "Camera access requires a secure context (HTTPS or localhost).";
  } else if (!hasMediaDevices || !hasGetUserMedia) {
    diagnosticMessage = "Your browser does not support optical video capture APIs.";
  } else if (!isPermissionsPolicyAllowed) {
    diagnosticMessage = "Camera access is disallowed by the website's Permissions-Policy header.";
  } else if (permissionState === "denied") {
    diagnosticMessage = "Camera permission has previously been denied in this browser.";
  }

  return {
    isSecureContext,
    hasMediaDevices,
    hasGetUserMedia,
    permissionState,
    isPermissionsPolicyAllowed,
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

  const errName =
    typeof err === "object" && err !== null && "name" in err
      ? String((err as { name: unknown }).name)
      : "";
  const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();

  // 0. Permissions Policy or Feature Policy restriction
  if (
    errMsg.includes("permissions policy") ||
    errMsg.includes("feature policy") ||
    errMsg.includes("permissions-policy") ||
    errMsg.includes("feature-policy") ||
    errMsg.includes("policy-controlled") ||
    errMsg.includes("disallowed by permissions policy")
  ) {
    return {
      code: "policy_blocked",
      title: "Camera Access Blocked by Policy",
      message: "Camera access is restricted by the website's Permissions Policy or browser security header.",
      instructions: [
        "The server's Permissions-Policy header must permit camera access (camera=(self)).",
        "If running inside an iframe, ensure the iframe element includes allow=\"camera\".",
        "Reload the page once header permissions are configured.",
      ],
      canRetry: false,
      fallbackToManual: true,
      isExpectedDenial: false,
    };
  }

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
        "In mobile Chrome: tap the page controls icon (tune / sliders or lock) beside the address bar, or tap menu (⋮) > Settings > Site settings > Camera.",
        "Set Camera permission to 'Allow' for dev.itclub.one.",
        "On Android: if Chrome itself lacks system camera permission, open Android Settings > Apps > Chrome > Permissions > Camera and select 'Allow only while using the app'.",
        "On iOS Safari: tap 'aA' or page settings in the address bar > Website Settings > Camera > select 'Allow'.",
        "Return to the scanner and tap 'Try Again'.",
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
        "Check that your webcam or mobile camera is connected and recognized.",
        "Ensure no physical privacy shutter or hardware switch is disabling the optical sensor.",
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
      title: "Camera Hardware In Use or Unavailable",
      message: "The camera is currently locked or being used by another application or browser tab.",
      instructions: [
        "Close other apps that may be using video (Zoom, Microsoft Teams, Google Meet, WhatsApp, Camera app).",
        "Check if another browser tab is currently streaming from the camera.",
        "Tap 'Try Again' once the camera hardware has been released.",
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
      message: "The requested camera specifications (e.g. rear environment sensor) could not be satisfied by this device.",
      instructions: [
        "Switch to another available camera from the camera selector dropdown.",
        "Tap 'Try Again' to scan using default camera settings.",
      ],
      canRetry: true,
      fallbackToManual: true,
      isExpectedDenial: false,
    };
  }

  // 5. Insecure Context or SecurityError
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

  // 6. Missing navigator.mediaDevices / unsupported browser
  if (
    errMsg.includes("unsupported browser") ||
    errMsg.includes("getusermedia is unavailable") ||
    errMsg.includes("not supported by this browser")
  ) {
    return {
      code: "unsupported",
      title: "Camera APIs Not Supported",
      message: "Your browser does not support optical video capture or modern media devices APIs.",
      instructions: [
        "Update your browser to a modern release of Chrome, Safari, Edge, or Firefox.",
        "Use manual token entry below to check in candidates.",
      ],
      canRetry: false,
      fallbackToManual: true,
      isExpectedDenial: false,
    };
  }

  // 7. Generic or Unknown Error
  const safeMessage = err instanceof Error ? err.message : String(err);
  return {
    code: "unknown",
    title: "Camera Initialization Failed",
    message: safeMessage ? `Camera error: ${safeMessage}` : "Unable to start optical scanner.",
    instructions: [
      "Check that your browser is up to date and has permission to access media devices.",
      "Tap 'Try Again' or switch to manual token entry.",
    ],
    canRetry: true,
    fallbackToManual: true,
    isExpectedDenial: false,
  };
}

/**
 * Safely probe camera stream acquisition with explicit constraints and immediate cleanup.
 * Guarantees all media tracks are stopped so hardware locks are prevented.
 */
export async function probeCameraStream(
  constraints: MediaStreamConstraints = {
    video: { facingMode: { ideal: "environment" } },
    audio: false,
  },
  customGetUserMedia?: (c: MediaStreamConstraints) => Promise<MediaStream>
): Promise<{
  success: boolean;
  error?: CameraErrorInfo;
  trackSettings?: MediaTrackSettings;
}> {
  let stream: MediaStream | null = null;
  try {
    const gum =
      customGetUserMedia ||
      (typeof navigator !== "undefined" && navigator.mediaDevices
        ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
        : null);

    if (!gum) {
      return {
        success: false,
        error: classifyCameraError(
          new Error("navigator.mediaDevices.getUserMedia is unavailable.")
        ),
      };
    }

    stream = await gum(constraints);
    const videoTrack = stream.getVideoTracks()[0];
    const trackSettings = videoTrack?.getSettings?.();

    return {
      success: true,
      trackSettings,
    };
  } catch (err) {
    return {
      success: false,
      error: classifyCameraError(err),
    };
  } finally {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
    }
  }
}
