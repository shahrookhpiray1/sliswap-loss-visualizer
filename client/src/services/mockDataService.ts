// src/services/mockDataService.ts
import mockTransactions from '../mock/transactions.json';

export interface Transaction {
  id: string;
  tokenPair: string;
  type: string;
  expectedAmount: number;
  actualAmount: number;
  timestamp: string;
}

export function getMockTransactions(): Transaction[] {
  return mockTransactions;
}