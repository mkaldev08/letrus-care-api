export function getMonthsBetween(
  startDate: Date,
  endDate: Date
): { month: string; year: number }[] {
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const result = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    result.push({
      month: meses[current.getMonth()],
      year: current.getFullYear(),
    });
    current.setMonth(current.getMonth() + 1);
  }

  return result;
}
