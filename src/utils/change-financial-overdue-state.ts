import { schedule } from "node-cron";
import { FinancialPlanModel } from "../models/financial-plan-model";
import { subDays, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const LUANDA_TZ = "Africa/Luanda";
//const cronTrigger = "0 0 11 * *";
const cronTrigger = "*/30 * * * * *";

/**
 * @function changeOverDueStatus
 * @description
 * Percorre todos os registos financeiros com o estado **"pending"** e altera o estado para **"overdue"**
 * caso a data de vencimento (`dueDate`) já tenha expirado.
 *
 * O cron job é executado automaticamente no **dia 11 de cada mês**, à meia-noite (horário de Luanda),
 * pois o pagamento expira no **dia 10**. Assim, todos os planos pendentes com `dueDate` até o dia 10
 * (incluindo meses anteriores ao atual) são considerados em atraso.
 *
 * @example
 * // Exemplo de execução automática:
 * // No dia 11/11/2025, serão marcados como "overdue" todos os planos
 * // com status "pending" e dueDate até 10/11/2025 23:59:59.
 *
 * @returns {Promise<void>} Não retorna valor, apenas executa a atualização no banco.
 */
async function changeOverDueStatus() {
  try {
    const now = toZonedTime(new Date(), LUANDA_TZ);
    const limitDate = endOfDay(subDays(now, 1)); // dia 10 (fim do dia)

    const result = await FinancialPlanModel.updateMany(
      {
        status: "pending",
        dueDate: { $lte: limitDate },
      },
      {
        $set: { status: "overdue" },
      }
    );

    console.log(
      `[${now.toISOString()}] Cron Job concluído: ${result.modifiedCount} planos marcados como 'overdue'.`
    );
  } catch (error) {

    if (process.env.NODE_ENV === 'development')
      console.error(
        `[${new Date().toISOString()}] Erro ao atualizar planos financeiros:`,
        error
      );
    else {
      console.error(
        `[${new Date().toISOString()}] Erro ao atualizar planos financeiros:`
      );
    }
  }
}

/**
 * @constant changeOverDueStatusJob
 * @description
 * Agenda o job `changeOverDueStatus` para ser executado automaticamente no
 * **dia 11 de cada mês, às 00:00 (meia-noite)**, com fuso horário de Luanda.
 */
const changeOverDueStatusJob = schedule(cronTrigger, changeOverDueStatus, {
  timezone: LUANDA_TZ,
});

export default changeOverDueStatusJob
