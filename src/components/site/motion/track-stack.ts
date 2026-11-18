"use client";

import { gsap, motionQueries } from "./gsap";
import { stackPanelIndex, stackPanelTime } from "@/lib/ui/stack-navigation";

export function setupTrackStack(
  root: HTMLElement,
  mm: ReturnType<typeof gsap.matchMedia>,
) {
  const stacks = Array.from(
    root.querySelectorAll<HTMLElement>("[data-track-stack]"),
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
      let active = -1;
      pin.tabIndex = 0;
      if (!originalLabel)
        pin.setAttribute(
          "aria-label",
          "Track chapters. Scroll or use the up and down arrow keys to explore.",
        );

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
          id: "site-track-stack",
          trigger: pin,
          pin: true,
          start: "top 96px",
          end: () =>
            `+=${Math.round(window.innerHeight * panels.length * 0.94)}`,
          scrub: 0.68,
          anticipatePin: 1,
          invalidateOnRefresh: true,
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

      // The counter follows the rendered (scrubbed) timeline, not its scroll target.
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
      const scrollToPanel = (index: number) => {
        const trigger = sequence.scrollTrigger;
        if (!trigger) return;
        const time = stackPanelTime(index, panels.length, sequence.duration());
        window.scrollTo({
          top:
            trigger.start +
            (trigger.end - trigger.start) * (time / sequence.duration()),
          behavior: "smooth",
        });
      };
      const onKeyDown = (event: KeyboardEvent) => {
        const target = event.target;
        if (
          !(target instanceof HTMLElement) ||
          target.matches("input, textarea, select") ||
          target.isContentEditable
        )
          return;
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        const next = event.key === "ArrowDown" ? active + 1 : active - 1;
        if (next < 0 || next >= panels.length) return;
        event.preventDefault();
        scrollToPanel(next);
      };
      pin.addEventListener("keydown", onKeyDown);
      renderState();
      return () => {
        pin.removeEventListener("keydown", onKeyDown);
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
