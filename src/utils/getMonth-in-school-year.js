export function getMonthsBetween(startDate, endDate) {
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
