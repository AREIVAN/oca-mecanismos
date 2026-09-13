import { KIND, type Kind } from "./content";
const joint = (x: number, y: number) =>
  `<circle cx="${x}" cy="${y}" r="4" fill="var(--paper, #f6f1e4)" stroke="currentColor" stroke-width="2.5"/>`;
const ground = (x: number, y: number) =>
  `<path d="M${x - 7} ${y + 7}h14m-12 0-4 5m10-5-4 5m10-5-4 5" opacity=".55"/>`;
export function diagram(kind: Kind, label = "", extra = ""): string {
  let body = "";
  if (kind === KIND.FOUR)
    body = `<path d="M20 56 34 19 77 28 88 56Z"/><path d="M34 19 77 28" stroke="var(--accent, #d67b48)" stroke-width="5"/>${ground(20, 56)}${ground(88, 56)}${joint(20, 56)}${joint(34, 19)}${joint(77, 28)}${joint(88, 56)}`;
  if (kind === KIND.LINK)
    body = `<path d="M24 53 84 21" stroke-width="7"/>${joint(24, 53)}${joint(84, 21)}`;
  if (kind === KIND.REVOLUTE)
    body = `<path d="M20 56 55 36 89 17" stroke-width="5"/><circle cx="55" cy="36" r="11"/>${joint(55, 36)}<path d="M72 48a23 23 0 0 1-29 7m0-7v7h7" stroke-width="2" opacity=".55"/>`;
  if (kind === KIND.SLIDER)
    body = `<path d="M14 26h83M14 51h83" opacity=".5"/><rect x="43" y="29" width="30" height="19" rx="2" fill="var(--paper, #f6f1e4)"/><path d="M18 39h40m26 0h13m-5-5 5 5-5 5"/>${joint(58, 39)}`;
  if (kind === KIND.CRANK)
    body = `<circle cx="52" cy="38" r="26" stroke-dasharray="3 5" opacity=".4"/><path d="M52 38 70 19" stroke-width="5"/>${ground(52, 38)}${joint(52, 38)}${joint(70, 19)}<path d="m79 30-4-9 9 1"/>`;
  if (kind === KIND.RIGID)
    body = `<path d="M23 56 54 16 87 56Z"/>${ground(23, 56)}${ground(87, 56)}${joint(23, 56)}${joint(54, 16)}${joint(87, 56)}<path d="m49 36 10 10m0-10L49 46" stroke="var(--accent, #d67b48)"/>`;
  return `<svg class="diagram ${extra}" viewBox="0 0 110 76" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
// Clockwise inward spiral, starting at the bottom-left: adjacent numbers share an edge.
export function boardCoordinates(): [number, number][] {
  const cells: [number, number][] = [];
  let left = 0,
    right = 8,
    top = 0,
    bottom = 8;
  while (left <= right && top <= bottom) {
    for (let x = left; x <= right; x++) cells.push([x, bottom]);
    bottom--;
    for (let y = bottom; y >= top; y--) cells.push([right, y]);
    right--;
    for (let x = right; x >= left; x--) cells.push([x, top]);
    top++;
    for (let y = top; y <= bottom; y++) cells.push([left, y]);
    left++;
  }
  return cells.slice(0, 63);
}
