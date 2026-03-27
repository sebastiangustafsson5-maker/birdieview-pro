export const getTargetsForHcp = (hcp: number = 18) => {
  if (hcp <= 0) return { score: 72, fairway: 65, gir: 68, scrambling: 60, putts: 29 };
  if (hcp <= 5) return { score: 77, fairway: 55, gir: 50, scrambling: 45, putts: 31 };
  if (hcp <= 10) return { score: 82, fairway: 50, gir: 40, scrambling: 35, putts: 33 };
  if (hcp <= 18) return { score: 90, fairway: 45, gir: 25, scrambling: 25, putts: 35 };
  if (hcp <= 27) return { score: 99, fairway: 40, gir: 15, scrambling: 15, putts: 37 };
  return { score: 108, fairway: 35, gir: 5, scrambling: 10, putts: 40 };
};
