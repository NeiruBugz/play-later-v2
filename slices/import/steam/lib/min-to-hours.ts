function minToHours(min: number) {
  if (min === 0) return 0;
  const hours = min / 60;
  return Math.round(hours * 10) / 10;
}

export { minToHours };
