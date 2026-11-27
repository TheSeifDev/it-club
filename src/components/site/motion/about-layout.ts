export type ClosedAboutOffset = { element: HTMLElement; x: number; y: number };

/** Measure each word's displacement from a heading layout with the first N chips open. */
export function measureAboutWordOffsets(statement: HTMLElement, expandedChipCount = 0): ClosedAboutOffset[] {
  const parent = statement.parentElement;
  if (!parent) return [];

  const originalWords = Array.from(statement.querySelectorAll<HTMLElement>("[data-editorial-word]"));
  const originalHeadingRect = statement.getBoundingClientRect();
  const originalWordRects = originalWords.map((word) => word.getBoundingClientRect());
  if (originalHeadingRect.width <= 0 || originalWords.length === 0 || originalWordRects.some((rect) => rect.width <= 0)) {
    return [];
  }

  const clone = statement.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.setAttribute("aria-hidden", "true");
  clone.setAttribute("inert", "");

  const forceStyle = (element: HTMLElement, property: string, value: string) => {
    element.style.setProperty(property, value, "important");
  };

  forceStyle(clone, "position", "absolute");
  forceStyle(clone, "left", "0");
  forceStyle(clone, "top", "0");
  forceStyle(clone, "width", `${originalHeadingRect.width}px`);
  forceStyle(clone, "box-sizing", "border-box");
  forceStyle(clone, "min-width", "0");
  forceStyle(clone, "max-width", "none");
  forceStyle(clone, "visibility", "hidden");
  forceStyle(clone, "pointer-events", "none");

  const cloneElements = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))];
  for (const element of cloneElements) {
    for (const property of ["transform", "translate", "rotate", "scale"]) {
      forceStyle(element, property, "none");
    }
  }

  const chips = Array.from(clone.querySelectorAll<HTMLElement>("[data-editorial-chip]"));
  chips.forEach((chip, index) => {
    if (index < expandedChipCount) return;
    for (const [property, value] of [
      ["width", "0"],
      ["min-width", "0"],
      ["padding", "0"],
      ["margin", "0"],
      ["border", "0"],
      ["border-width", "0"],
      ["border-style", "none"],
      ["font-size", "0"],
      ["line-height", "0"],
      ["height", "0"],
      ["overflow", "hidden"],
    ]) {
      forceStyle(chip, property, value);
    }
  });

  try {
    // Appending as a direct sibling preserves inherited styles and parent > h2 rules.
    parent.appendChild(clone);
    const closedWords = Array.from(clone.querySelectorAll<HTMLElement>("[data-editorial-word]"));
    if (
      closedWords.length !== originalWords.length ||
      closedWords.some((word, index) => word.textContent !== originalWords[index]?.textContent)
    ) {
      return [];
    }

    const closedHeadingRect = clone.getBoundingClientRect();
    if (closedHeadingRect.width <= 0) return [];

    const closedWordRects = closedWords.map((word) => word.getBoundingClientRect());
    if (closedWordRects.some((rect) => rect.width <= 0)) return [];

    return originalWords.map((element, index) => ({
      element,
      x:
        closedWordRects[index].left - closedHeadingRect.left -
        (originalWordRects[index].left - originalHeadingRect.left),
      y:
        closedWordRects[index].top - closedHeadingRect.top -
        (originalWordRects[index].top - originalHeadingRect.top),
    }));
  } catch {
    return [];
  } finally {
    clone.remove();
  }
}

/** Measure a progression from all chips collapsed to each chip opening in reading order. */
export function measureAboutWordLayoutStates(statement: HTMLElement): ClosedAboutOffset[][] {
  const chipCount = statement.querySelectorAll("[data-editorial-chip]").length;
  const states = Array.from({ length: chipCount + 1 }, (_, expandedChipCount) =>
    measureAboutWordOffsets(statement, expandedChipCount),
  );

  return states.every((state) => state.length > 0) ? states : [];
}
