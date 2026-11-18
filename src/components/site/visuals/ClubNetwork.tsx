"use client";

import { useEffect, useRef } from "react";
import { CLUB_NETWORK_EVENT, type ClubNetworkState } from "@/lib/visuals/club-network-config";
import type { ClubNetworkHandle } from "@/lib/visuals/club-network-scene";
import styles from "./ClubNetwork.module.css";

type DeviceNavigator = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

const isLowPower = () => {
  const nav = navigator as DeviceNavigator;
  return Boolean(nav.connection?.saveData) ||
    (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) ||
    (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2);
};

const validState = (detail: unknown): ClubNetworkState => {
  const progress = typeof detail === "object" && detail !== null && "progress" in detail
    ? Number((detail as { progress?: unknown }).progress)
    : 0;
  return { progress: Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0 };
};

/**
 * Identity's club-network visual. GSAP remains the source of truth: this
 * component only subscribes to `club:network` and never creates a ScrollTrigger.
 * The CSS artwork renders immediately; capable devices progressively enhance it
 * with the dynamically imported Three.js scene once it is near the viewport.
 */
export function ClubNetwork({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const host = hostRef.current;
    if (!root || !host) return;

    let disposed = false;
    let failed = false;
    let near = false;
    let visible = false;
    let loading = false;
    let version = 0;
    let idle = 0;
    let timer = 0;
    let handle: ClubNetworkHandle | null = null;
    let state: ClubNetworkState = { progress: 0 };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowPower = isLowPower();

    const allowed = () => !disposed && !failed && !lowPower && !reducedMotion.matches;
    const setRenderer = (mode: "fallback" | "webgl") => {
      root.dataset.renderer = mode;
    };
    const setWebGL = (mode: "fallback" | "loading" | "ready") => {
      host.dataset.webgl = mode;
    };
    setWebGL("fallback");
    const cancelSchedule = () => {
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
      idle = 0;
      timer = 0;
    };
    const stop = () => {
      version += 1;
      loading = false;
      cancelSchedule();
      handle?.dispose();
      handle = null;
      setRenderer("fallback");
      setWebGL("fallback");
    };

    const activate = async () => {
      idle = 0;
      timer = 0;
      if (!allowed() || !near || loading || handle) return;
      loading = true;
      setWebGL("loading");
      const current = ++version;
      try {
        const { createClubNetwork } = await import("@/lib/visuals/club-network-scene");
        if (!allowed() || current !== version) return;
        const created = await createClubNetwork(host, {
          onReady: () => {
            if (!disposed && current === version) {
              setWebGL("ready");
              setRenderer("webgl");
            }
          },
          onFailure: () => {
            if (disposed || current !== version) return;
            failed = true;
            stop();
          },
        });
        if (!created) return;
        if (!allowed() || current !== version) {
          created.dispose();
          return;
        }
        handle = created;
        handle.setState(state);
        handle.setVisible(visible && !document.hidden);
      } catch {
        if (current === version) {
          failed = true;
          stop();
        }
      } finally {
        if (current === version) loading = false;
      }
    };

    const schedule = () => {
      if (!allowed() || !near || loading || handle || idle || timer) return;
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(() => void activate(), { timeout: 1400 });
      } else {
        timer = window.setTimeout(() => void activate(), 280);
      }
    };
    const onNetwork = (event: Event) => {
      state = validState((event as CustomEvent<ClubNetworkState>).detail);
      handle?.setState(state);
    };
    const onMedia = () => {
      if (allowed()) schedule();
      else stop();
    };
    const onVisibility = () => handle?.setVisible(visible && !document.hidden);

    const intersection = new IntersectionObserver(
      ([entry]) => {
        near = Boolean(entry?.isIntersecting);
        if (near) schedule();
      },
      { rootMargin: "120% 0px 120% 0px" },
    );
    const viewport = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      handle?.setVisible(visible && !document.hidden);
    });
    const resize = new ResizeObserver(() => handle?.resize());

    window.addEventListener(CLUB_NETWORK_EVENT, onNetwork);
    reducedMotion.addEventListener("change", onMedia);
    document.addEventListener("visibilitychange", onVisibility);
    intersection.observe(root);
    viewport.observe(root);
    resize.observe(host);

    return () => {
      disposed = true;
      stop();
      intersection.disconnect();
      viewport.disconnect();
      resize.disconnect();
      window.removeEventListener(CLUB_NETWORK_EVENT, onNetwork);
      reducedMotion.removeEventListener("change", onMedia);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${styles.root}${className ? ` ${className}` : ""}`}
      data-renderer="fallback"
      data-club-network
      aria-hidden="true"
    >
      <div className={styles.fallback}>
        <span className={styles.haze} />
        <span className={`${styles.orbit} ${styles.orbitA}`} />
        <span className={`${styles.orbit} ${styles.orbitB}`} />
        <span className={`${styles.orbit} ${styles.orbitC}`} />
        <span className={styles.coreHalo} />
        <span className={styles.core} />
        <span className={`${styles.cluster} ${styles.clusterA}`}><i /><i /><i /><i /></span>
        <span className={`${styles.cluster} ${styles.clusterB}`}><i /><i /><i /><i /></span>
        <span className={`${styles.cluster} ${styles.clusterC}`}><i /><i /><i /><i /></span>
        <span className={`${styles.cluster} ${styles.clusterD}`}><i /><i /><i /><i /></span>
        <span className={`${styles.cluster} ${styles.clusterE}`}><i /><i /><i /><i /></span>
        <span className={`${styles.cluster} ${styles.clusterF}`}><i /><i /><i /><i /></span>
      </div>
      <div ref={hostRef} className={styles.host} data-webgl="fallback" />
    </div>
  );
}
