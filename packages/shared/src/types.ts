import { Currency } from './enums';

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CalculateRequest {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  originId: string;
  destinationId: string;
}

export interface CalculateResult {
  actualWeight: number;
  volumetricWeight: number;
  billableWeight: number;
  price: number;
  currency: Currency;
}

/** Profit breakdown for a single box */
export interface BoxProfitSummary {
  boxId: string;
  boxCode: string;
  revenue: number;          // final_price (what customer paid)
  directExpenses: number;   // expenses with scope=BOX linked to this box
  batchExpenseShare: number; // batch expenses / number of boxes in batch
  totalExpenses: number;    // directExpenses + batchExpenseShare
  netProfit: number;        // revenue - totalExpenses
  marginPct: number;        // (netProfit / revenue) * 100
  currency: Currency;
}

/** Aggregated profit report */
export interface ProfitReport {
  period: { from: string; to: string };
  totalRevenue: number;
  totalExpenses: number;
  totalDirectExpenses: number;
  totalBatchExpenses: number;
  totalGeneralExpenses: number;
  netProfit: number;
  marginPct: number;
  currency: Currency;
  boxCount: number;
  boxes: BoxProfitSummary[];
}
