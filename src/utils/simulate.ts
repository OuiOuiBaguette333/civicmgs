export default function (value: number, percent = 0): number {
  const appliedChange = value * (1 + percent / 100)
  return Math.round(appliedChange)
}
