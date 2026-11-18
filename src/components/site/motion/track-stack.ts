"use client";

import { gsap, motionQueries, ScrollTrigger } from "./gsap";
import { stackPanelIndex, stackPanelTime } from "@/lib/ui/stack-navigation";

type StackOptions = {
  selector?: string;
  id?: string;
  hashNavigation?: boolean;
};

/** One stack engine; page-specific selectors prevent duplicate Home/Tracks setup. */
export function setupTrackStack(
  root: HTMLElement,
  mm: ReturnType<typeof gsap.matchMedia>,
  options: StackOptions = {},
) {
  const stacks = Array.from(
    root.querySelectorAll<HTMLElement>(
      options.selector ?? "[data-track-stack]",
    ),
  );
  stacks.forEach((stack) => {
    const pin = stack.querySelector<HTMLElement>("[data-stack-pin]");
    const panels = Array.from(
      stack.querySelectorAll<HTMLElement>("[data-stack-panel]"),
    );
    if (!pin || panels.length < 2) return;

    mm.add(motionQueries.stage, () => {
      const progress = stack.querySelector<HTMLElement>(
        "[data-stack-progress]",
      );
      const counter = stack.querySelector<HTMLElement>("[data-stack-counter]");
      const originalTabIndex = pin.getAttribute("tabindex");
      const originalLabel = pin.getAttribute("aria-label");
      const scrollAreas = Array.from(
        stack.querySelectorAll<HTMLElement>("[data-stack-scroll]"),
      );
      const areaTabIndexes = new Map(
        scrollAreas.map((area) => [area, area.getAttribute("tabindex")]),
      );
      let active = -1;
      let alive = true;
      let initialHashHandled = false;
      let initialFrame: number | undefined;
      pin.tabIndex = 0;
      if (!originalLabel)
        pin.setAttribute(
          "aria-label",
          "Track chapters. Scroll or use the up and down arrow keys to explore.",
        );

      const restoreTabIndex = (area: HTMLElement) => {
        const original = areaTabIndexes.get(area);
        if (original == null) area.removeAttribute("tabindex");
        else area.setAttribute("tabindex", original);
      };
      const syncScrollableAreas = () => {
        scrollAreas.forEach((area) => {
          if (area.scrollHeight > area.clientHeight + 2) area.tabIndex = 0;
          else restoreTabIndex(area);
        });
      };
      const setActive = (index: number) => {
        if (index === active) return;
        const oldPanel = panels[active];
        // Move focus BEFORE making its old ancestor aria-hidden or inert.
        if (oldPanel?.contains(document.activeElement))
          pin.focus({ preventScroll: true });
        active = index;
        panels.forEach((panel, panelIndex) => {
          const isActive = panelIndex === index;
          panel.setAttribute("data-stack-current", String(isActive));
          panel.setAttribute("aria-hidden", String(!isActive));
          panel.inert = !isActive;
        });
        if (counter) counter.textContent = String(index + 1).padStart(2, "0");
      };

      stack.setAttribute("data-stack-mode", "pinned");
      gsap.set(panels.slice(1), { yPercent: 105, scale: 1.01 });
      const sequence = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          id: options.id ?? "site-track-stack",
          trigger: pin,
          pin: true,
          start: "top 96px",
          end: () =>
            `+=${Math.round(window.innerHeight * panels.length * 0.94)}`,
          scrub: 0.68,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: syncScrollableAreas,
        },
      });
      panels.slice(1).forEach((panel, index) => {
        sequence.to(
          panels.slice(0, index + 1),
          {
            yPercent: -4,
            scale: 0.975,
            duration: 0.8,
            ease: "power1.inOut",
          },
          index,
        );
        sequence.fromTo(
          panel,
          { yPercent: 105, scale: 1.01 },
          { yPercent: 0, scale: 1, duration: 1, ease: "power2.out" },
          index + 0.04,
        );
      });
      sequence.to(
        panels[panels.length - 1],
        {
          yPercent: -8,
          scale: 0.985,
          duration: 0.72,
          ease: "power1.inOut",
        },
        panels.length - 1 + 1.04,
      );

      // Counter and inert state follow the rendered scrub, not its scroll target.
      const renderState = () => {
        setActive(stackPanelIndex(sequence.time(), panels.length));
        const amount = sequence.progress();
        if (progress) {
          gsap.set(progress, { scaleX: amount });
          progress
            .closest<HTMLElement>('[role="progressbar"]')
            ?.setAttribute("aria-valuenow", String(Math.round(amount * 100)));
        }
      };
      sequence.eventCallback("onUpdate", renderState);
      const scrollToPanel = (
        index: number,
        behavior: ScrollBehavior = "smooth",
      ) => {
        const trigger = sequence.scrollTrigger;
        if (!trigger) return;
        const time = stackPanelTime(index, panels.length, sequence.duration());
        window.scrollTo({
          top:
            trigger.start +
            (trigger.end - trigger.start) * (time / sequence.duration()),
          behavior,
        });
        if (behavior === "instant") {
          trigger.update();
          trigger.getTween()?.progress(1);
          sequence.time(time);
          renderState();
        }
      };
      const hashIndex = (hash: string) => {
        try {
          const id = decodeURIComponent(hash.slice(1));
          return id ? panels.findIndex((panel) => panel.id === id) : -1;
        } catch {
          return -1;
        }
      };
      const onAnchorClick = (event: MouseEvent) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const anchor =
          event.target instanceof Element
            ? event.target.closest<HTMLAnchorElement>("a[href]")
            : null;
        const href = anchor?.getAttribute("href");
        if (
          !href?.startsWith("#") ||
          anchor?.hasAttribute("download") ||
          (anchor?.target && anchor.target !== "_self")
        )
          return;
        const index = hashIndex(href);
        if (index < 0) return;
        event.preventDefault();
        initialHashHandled = true;
        if (window.location.hash !== href)
          window.history.pushState(null, "", href);
        scrollToPanel(index);
      };
      const onHashChange = () => {
        initialHashHandled = true;
        const index = hashIndex(window.location.hash);
        if (index >= 0) scrollToPanel(index, "instant");
      };
      const onKeyDown = (event: KeyboardEvent) => {
        const target = event.target;
        if (
          !(target instanceof HTMLElement) ||
          target.matches("input, textarea, select") ||
          target.isContentEditable ||
          target.closest("[data-stack-scroll]")
        )
          return;
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        const next = event.key === "ArrowDown" ? active + 1 : active - 1;
        if (next < 0 || next >= panels.length) return;
        event.preventDefault();
        initialHashHandled = true;
        scrollToPanel(next);
      };
      pin.addEventListener("keydown", onKeyDown);
      if (options.hashNavigation) {
        root.addEventListener("click", onAnchorClick);
        window.addEventListener("hashchange", onHashChange);
        // Absolute stacked panels share an origin; resolve incoming hashes AFTER layout.
        void document.fonts.ready.then(() => {
          if (!alive || initialHashHandled) return;
          initialFrame = requestAnimationFrame(() => {
            if (!alive || initialHashHandled) return;
            initialHashHandled = true;
            const index = hashIndex(window.location.hash);
            if (index >= 0) {
              ScrollTrigger.refresh();
              scrollToPanel(index, "instant");
            }
          });
        });
      }
      syncScrollableAreas();
      renderState();
      return () => {
        alive = false;
        if (initialFrame !== undefined) cancelAnimationFrame(initialFrame);
        pin.removeEventListener("keydown", onKeyDown);
        if (options.hashNavigation) {
          root.removeEventListener("click", onAnchorClick);
          window.removeEventListener("hashchange", onHashChange);
        }
        sequence.eventCallback("onUpdate", null);
        stack.removeAttribute("data-stack-mode");
        if (originalTabIndex === null) pin.removeAttribute("tabindex");
        else pin.setAttribute("tabindex", originalTabIndex);
        if (originalLabel === null) pin.removeAttribute("aria-label");
        else pin.setAttribute("aria-label", originalLabel);
        panels.forEach((panel) => {
          panel.removeAttribute("data-stack-current");
          panel.removeAttribute("aria-hidden");
          panel.inert = false;
        });
        scrollAreas.forEach(restoreTabIndex);
        gsap.set(panels, { clearProps: "transform,opacity" });
        if (counter) counter.textContent = "01";
        if (progress) {
          progress.removeAttribute("style");
          progress
            .closest<HTMLElement>('[role="progressbar"]')
            ?.setAttribute("aria-valuenow", "0");
        }
      };
    });
  });
}
