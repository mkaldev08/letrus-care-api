type TypeGetMonthsBetween = {
  month: string;
  year: number;
  monthInNumber: number;
};

export function getMonthsBetween(startDate: Date, endDate: Date) {
  const monthHardList: { month: string; monthInNumber: number }[] = [
    { month: "Janeiro", monthInNumber: 0 },
    { month: "Fevereiro", monthInNumber: 1 },
    { month: "Março", monthInNumber: 2 },
    { month: "Abril", monthInNumber: 3 },
    { month: "Maio", monthInNumber: 4 },
    { month: "Junho", monthInNumber: 5 },
    { month: "Julho", monthInNumber: 6 },
    { month: "Agosto", monthInNumber: 7 },
    { month: "Setembro", monthInNumber: 8 },
    { month: "Outubro", monthInNumber: 9 },
    { month: "Novembro", monthInNumber: 10 },
    { month: "Dezembro", monthInNumber: 11 },
  ];

  let result = new Array<TypeGetMonthsBetween>();

  const currentDate = new Date(startDate);

  while (
    currentDate.getFullYear() < endDate.getFullYear() ||
    (currentDate.getFullYear() === endDate.getFullYear() &&
      currentDate.getMonth() <= endDate.getMonth())
  ) {
    result.push({
      month: monthHardList[currentDate.getMonth()].month,
      year: currentDate.getFullYear(),
      monthInNumber: monthHardList[currentDate.getMonth()].monthInNumber,
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return result;
}
