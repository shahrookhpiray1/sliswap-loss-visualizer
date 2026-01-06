// src/utils/calculateSwap.ts

export interface SwapResult {
  marketExpected: number;
  idealAmount: number;
  actualAmount: number;
  totalSlippage: number;
  feeSlippage: number;
}

const POOLS = {
  'EDS/USDT': { reserveIn: 2492395586673194n, reserveOut: 3014932793617n, feeBps: 12, decimalsIn: 8, decimalsOut: 6 },
  'EDS/VDEP': null, // multi-hop
  'USDT/EDS': { reserveIn: 3014932793617n, reserveOut: 2492395586673194n, feeBps: 12, decimalsIn: 6, decimalsOut: 8 },
  'USDT/VDEP': { reserveIn: 96616536647n, reserveOut: 51767305097704601n, feeBps: 12, decimalsIn: 6, decimalsOut: 8 },
  'VDEP/EDS': null, // multi-hop
  'VDEP/USDT': { reserveIn: 51767305097704601n, reserveOut: 96616536647n, feeBps: 12, decimalsIn: 8, decimalsOut: 6 },
};

function toRaw(amount: number, decimals: number): number {
  return amount * Math.pow(10, decimals);
}

function fromRaw(raw: number, decimals: number): number {
  return raw / Math.pow(10, decimals);
}

function calculateDirect(
  inputAmount: number,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: number,
  decimalsIn: number,
  decimalsOut: number
): SwapResult {
  const reserveInNum = Number(reserveIn);
  const reserveOutNum = Number(reserveOut);
  const amountInRaw = toRaw(inputAmount, decimalsIn);

  // قیمت مارکت (بدون price impact)
  const priceRatio = (reserveOutNum / Math.pow(10, decimalsOut)) / (reserveInNum / Math.pow(10, decimalsIn));
  const marketExpected = inputAmount * priceRatio;

  // Ideal (بدون fee، با price impact)
  const idealOutRaw = (reserveOutNum * amountInRaw) / (reserveInNum + amountInRaw);
  const idealAmount = fromRaw(idealOutRaw, decimalsOut);

  // Actual (با fee)
  const amountInWithFee = amountInRaw * (1 - feeBps / 10000);
  const actualOutRaw = (reserveOutNum * amountInWithFee) / (reserveInNum + amountInWithFee);
  const actualAmount = fromRaw(actualOutRaw, decimalsOut);

  const totalSlippage = ((marketExpected - actualAmount) / marketExpected) * 100;
  const feeSlippage = ((idealAmount - actualAmount) / idealAmount) * 100;

  return { marketExpected, idealAmount, actualAmount, totalSlippage, feeSlippage };
}

export function calculateSwap(
  from: 'EDS' | 'USDT' | 'VDEP',
  to: 'EDS' | 'USDT' | 'VDEP',
  inputAmount: number
): SwapResult | null {
  if (from === to || inputAmount <= 0) return null;

  const key = `${from}/${to}`;
  const pool = POOLS[key as keyof typeof POOLS];

  if (pool) {
    return calculateDirect(
      inputAmount,
      pool.reserveIn,
      pool.reserveOut,
      pool.feeBps,
      pool.decimalsIn,
      pool.decimalsOut
    );
  }

  // Multi-hop: EDS → VDEP = EDS → USDT → VDEP
  if (from === 'EDS' && to === 'VDEP') {
    const step1 = calculateSwap('EDS', 'USDT', inputAmount);
    if (!step1) return null;
    const step2 = calculateSwap('USDT', 'VDEP', step1.actualAmount);
    if (!step2) return null;
    return {
      marketExpected: step1.marketExpected * (step2.marketExpected / step1.actualAmount),
      idealAmount: step2.idealAmount,
      actualAmount: step2.actualAmount,
      totalSlippage: step1.totalSlippage + step2.totalSlippage,
      feeSlippage: step1.feeSlippage + step2.feeSlippage,
    };
  }

  // Multi-hop: VDEP → EDS = VDEP → USDT → EDS
  if (from === 'VDEP' && to === 'EDS') {
    const step1 = calculateSwap('VDEP', 'USDT', inputAmount);
    if (!step1) return null;
    const step2 = calculateSwap('USDT', 'EDS', step1.actualAmount);
    if (!step2) return null;
    return {
      marketExpected: step1.marketExpected * (step2.marketExpected / step1.actualAmount),
      idealAmount: step2.idealAmount,
      actualAmount: step2.actualAmount,
      totalSlippage: step1.totalSlippage + step2.totalSlippage,
      feeSlippage: step1.feeSlippage + step2.feeSlippage,
    };
  }

  return null;
}