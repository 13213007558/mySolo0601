import type { LAB, ColorCard } from '@/types';

function sq(n: number) {
  return n * n;
}

function ciede2000(lab1: LAB, lab2: LAB): number {
  const L1 = lab1.L, a1 = lab1.a, b1 = lab1.b;
  const L2 = lab2.L, a2 = lab2.a, b2 = lab2.b;

  const avg_Lp = (L1 + L2) / 2;
  const C1 = Math.sqrt(sq(a1) + sq(b1));
  const C2 = Math.sqrt(sq(a2) + sq(b2));
  const avg_C = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(avg_C, 7) / (Math.pow(avg_C, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(sq(a1p) + sq(b1));
  const C2p = Math.sqrt(sq(a2p) + sq(b2));
  const avg_Cp = (C1p + C2p) / 2;
  const delta_Lp = L2 - L1;
  const delta_Cp = C2p - C1p;
  let h1p = Math.atan2(b1, a1p) * (180 / Math.PI);
  if (h1p < 0) h1p += 360;
  let h2p = Math.atan2(b2, a2p) * (180 / Math.PI);
  if (h2p < 0) h2p += 360;

  let delta_hp = 0;
  const Cp_equals_zero = C1p * C2p === 0;
  if (!Cp_equals_zero) {
    if (Math.abs(h1p - h2p) <= 180) delta_hp = h2p - h1p;
    else if (h2p - h1p > 180) delta_hp = h2p - h1p - 360;
    else delta_hp = h2p - h1p + 360;
  }
  const delta_Hp = 2 * Math.sqrt(C1p * C2p) * Math.sin((delta_hp / 2) * (Math.PI / 180));

  let avg_hp = h1p + h2p;
  if (!Cp_equals_zero) {
    if (Math.abs(h1p - h2p) <= 180) avg_hp = (h1p + h2p) / 2;
    else if (h1p + h2p < 360) avg_hp = (h1p + h2p + 360) / 2;
    else avg_hp = (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos((avg_hp - 30) * (Math.PI / 180)) +
    0.24 * Math.cos(2 * avg_hp * (Math.PI / 180)) +
    0.32 * Math.cos((3 * avg_hp + 6) * (Math.PI / 180)) -
    0.2 * Math.cos((4 * avg_hp - 63) * (Math.PI / 180));

  const S_L = 1 + (0.015 * sq(avg_Lp - 50)) / Math.sqrt(20 + sq(avg_Lp - 50));
  const S_C = 1 + 0.045 * avg_Cp;
  const S_H = 1 + 0.015 * avg_Cp * T;

  const theta = 30 * Math.exp(-sq((avg_hp - 275) / 25));
  const R_C = 2 * Math.sqrt(Math.pow(avg_Cp, 7) / (Math.pow(avg_Cp, 7) + Math.pow(25, 7)));
  const R_T = -Math.sin(2 * theta * (Math.PI / 180)) * R_C;

  const k_L = 1, k_C = 1, k_H = 1;
  return Math.sqrt(
    sq(delta_Lp / (k_L * S_L)) +
      sq(delta_Cp / (k_C * S_C)) +
      sq(delta_Hp / (k_H * S_H)) +
      R_T * (delta_Cp / (k_C * S_C)) * (delta_Hp / (k_H * S_H))
  );
}

export function calculateClosestGrade(
  lab: LAB,
  cards: ColorCard[]
): {
  grade: ColorCard['grade'];
  deltaE: number;
  isWithinThreshold: boolean;
  closestCard: ColorCard;
  allDeltas: Array<{ grade: ColorCard['grade']; deltaE: number }>;
} {
  let minDelta = Infinity;
  let closestCard: ColorCard | null = null;
  const allDeltas: Array<{ grade: ColorCard['grade']; deltaE: number }> = [];

  for (const card of cards) {
    const delta = ciede2000(lab, card.labColor);
    allDeltas.push({ grade: card.grade, deltaE: Number(delta.toFixed(2)) });
    if (delta < minDelta) {
      minDelta = delta;
      closestCard = card;
    }
  }
  allDeltas.sort((a, b) => a.deltaE - b.deltaE);
  return {
    grade: closestCard!.grade,
    deltaE: Number(minDelta.toFixed(2)),
    isWithinThreshold: minDelta <= closestCard!.maxDeltaE,
    closestCard: closestCard!,
    allDeltas,
  };
}

export function calculateDeltaE(lab1: LAB, lab2: LAB): number {
  return Number(ciede2000(lab1, lab2).toFixed(2));
}

export function gradeColorHex(grade: ColorCard['grade'], cards: ColorCard[]): string {
  return cards.find((c) => c.grade === grade)?.hexColor ?? '#888';
}

export function labToRoughHex(lab: LAB): string {
  const y = (lab.L + 16) / 116;
  const x = lab.a / 500 + y;
  const z = y - lab.b / 200;
  const toLinear = (t: number) =>
    t > 0.206893 ? t * t * t : (t - 4 / 29) / 7.787;
  let X = 0.95047 * toLinear(x);
  let Y = 1.0 * toLinear(y);
  let Z = 1.08883 * toLinear(z);
  let r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
  let g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
  let b = X * 0.0557 + Y * -0.204 + Z * 1.057;
  const correct = (c: number) =>
    c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
  r = Math.max(0, Math.min(1, correct(r)));
  g = Math.max(0, Math.min(1, correct(g)));
  b = Math.max(0, Math.min(1, correct(b)));
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
