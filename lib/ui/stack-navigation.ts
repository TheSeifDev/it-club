/** Every incoming slab starts at (index - 1) + .04 and finishes at index + .04. */
export function stackPanelTime(index: number, count: number, duration: number) {
  const chapter = Math.max(0, Math.min(Math.floor(index), count - 1));
  return chapter === 0 ? 0 : Math.min(chapter + 0.08, duration);
}

/** Select the incoming slab after its eased rise makes the copy readable. */
export function stackPanelIndex(time: number, count: number) {
  return Math.max(0, Math.min(count - 1, Math.floor(time + 0.36)));
}
