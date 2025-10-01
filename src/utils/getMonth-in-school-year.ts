type TypeGetMonthsBetween = {
  month: string;
  year: number;
  monthInNumber: number;
};

export function getMonthsBetween(
  startDate: Date,
  endDate: Date
): TypeGetMonthsBetween[] {
  const meses: { month: string; inNumber: number }[] = [
    { month: "Janeiro", inNumber: 0 },
    { month: "Fevereiro", inNumber: 1 },
    { month: "Março", inNumber: 2 },
    { month: "Abril", inNumber: 3 },
    { month: "Maio", inNumber: 4 },
    { month: "Junho", inNumber: 5 },
    { month: "Julho", inNumber: 6 },
    { month: "Agosto", inNumber: 7 },
    { month: "Setembro", inNumber: 8 },
    { month: "Outubro", inNumber: 9 },
    { month: "Novembro", inNumber: 10 },
    { month: "Dezembro", inNumber: 11 },
  ];

  let result: TypeGetMonthsBetween[] = [];

  const current = new Date(startDate);

  while (current <= endDate) {
    result.push({
      month: meses[current.getMonth()].month,
      year: current.getFullYear(),
      monthInNumber: meses[current.getMonth()].inNumber,
    });
    current.setMonth(current.getMonth() + 1);
  }

  return result;
}
