export type ClosedAboutOffset = { element: HTMLElement; x: number };

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

  try {
    // Appending as a direct sibling preserves inherited styles and parent > h2 rules.
    parent.appendChild(clone);
    const cloneWords = Array.from(clone.querySelectorAll<HTMLElement>("[data-editorial-word]"));
    const layoutElements = Array.from(clone.querySelectorAll<HTMLElement>("[data-editorial-word], [data-editorial-chip]"));
    if (cloneWords.length !== originalWords.length || layoutElements.length === 0) return [];

    // Record the natural, fully-open row for each word before changing chip widths.
    const wordRows: { center: number; count: number }[] = [];
    for (const word of cloneWords) {
      const rect = word.getBoundingClientRect();
      if (rect.width <= 0) return [];
      const center = (rect.top + rect.bottom) / 2;
      const row = wordRows.find((candidate) => Math.abs(candidate.center - center) < 2);
      if (row) {
        row.center = (row.center * row.count + center) / (row.count + 1);
        row.count += 1;
      } else {
        wordRows.push({ center, count: 1 });
      }
    }
    wordRows.sort((a, b) => a.center - b.center);
    if (wordRows.length === 0) return [];

    // Read every row assignment before inserting breaks to avoid layout-dependent drift.
    const rowAssignments = layoutElements.map((element) => {
      const rect = element.getBoundingClientRect();
      const center = (rect.top + rect.bottom) / 2;
      let rowIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      wordRows.forEach((row, index) => {
        const distance = Math.abs(row.center - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          rowIndex = index;
        }
      });
      return rowIndex;
    });

    // Hard breaks keep collapsed/open measurements inside the same natural text rows.
    let previousRow = -1;
    for (const [index, element] of layoutElements.entries()) {
      const rowIndex = rowAssignments[index];
      if (rowIndex < previousRow) return [];
      if (previousRow >= 0 && rowIndex > previousRow) {
        clone.insertBefore(statement.ownerDocument.createElement("br"), element);
      }
      previousRow = rowIndex;
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

    const closedHeadingRect = clone.getBoundingClientRect();
    if (closedHeadingRect.width <= 0) return [];

    const closedWords = Array.from(clone.querySelectorAll<HTMLElement>("[data-editorial-word]"));
    if (
      closedWords.length !== originalWords.length ||
      closedWords.some((word, index) => word.textContent !== originalWords[index]?.textContent)
    ) {
      return [];
    }

    const closedWordRects = closedWords.map((word) => word.getBoundingClientRect());
    if (closedWordRects.some((rect) => rect.width <= 0)) return [];

    return originalWords.map((element, index) => ({
      element,
      x:
        closedWordRects[index].left - closedHeadingRect.left -
        (originalWordRects[index].left - originalHeadingRect.left),
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
