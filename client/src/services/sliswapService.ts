// src/services/sliswapService.ts

import { endlessClient } from './endlessClient';

// 🔑 آدرس‌های نهایی از اسکریپت شما (تبدیل‌شده از Base58 به 32-byte hex)
const POOL_ADDRESSES = {
  'EDS/USDT': "0x52fe2d47e68de101b84826dce2a09d9d37e2fd2256aa8cda13931ba07cf33082",
  'USDT/VDEP': "0x947079020ff7a80396813db930dc2731182d7d7601c253a5f44248446287aaac",
};

const METADATA = {
  USDT: "0x0707313fc6e87b5bad0bb90b65dbfe13522fde9e71261e91ab76e93fff707934",
  EDS: "0xc69712057e634bebc9ab02745d2d69ee738e3eb4f5d30189a9acbf8e08fb823e",
  VDEP: "0x073a178b234acfa232c3c44fd94a32076d4f8a53dba143d99f3bafc84a05620d",
};

const DECIMALS = {
  USDT: 6,
  EDS: 8,
  VDEP: 8,
};

function toAtomic(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * 10 ** decimals));
}

function fromAtomic(amount: bigint, decimals: number): number {
  return Number(amount) / (10 ** decimals);
}

// خواندن amountOut از یک استخر مستقیم
async function getDirectAmountOut(
  poolAddress: string,
  tokenIn: 'USDT' | 'EDS' | 'VDEP',
  amountIn: number
): Promise<number> {
  const amountInAtomic = toAtomic(amountIn, DECIMALS[tokenIn]);
  const res = await endlessClient.view({
    payload: {
      function: "0x4198e1871cf459faceccb3d3e86882d7337d17badb0626a33538674385f6e5f4::liquidity_pool::get_amount_out",
      typeArguments: [],
      functionArguments: [poolAddress, METADATA[tokenIn], amountInAtomic.toString()],
    },
  });
  const outAtomic = BigInt(res[0] as string);
  const outToken = getOutputToken(poolAddress, tokenIn);
  return fromAtomic(outAtomic, DECIMALS[outToken]);
}

function getOutputToken(poolAddress: string, tokenIn: string): 'USDT' | 'EDS' | 'VDEP' {
  if (poolAddress === POOL_ADDRESSES['EDS/USDT']) {
    return tokenIn === 'EDS' ? 'USDT' : 'EDS';
  }
  if (poolAddress === POOL_ADDRESSES['USDT/VDEP']) {
    return tokenIn === 'USDT' ? 'VDEP' : 'USDT';
  }
  throw new Error('Unknown pool');
}

// خواندن reserveها
async function getReserves(poolAddress: string) {
  const res = await endlessClient.view({
    payload: {
      function: "0x4198e1871cf459faceccb3d3e86882d7337d17badb0626a33538674385f6e5f4::liquidity_pool::pool_reserves",
      typeArguments: [],
      functionArguments: [poolAddress],
    },
  });
  return { r0: BigInt(res[0] as string), r1: BigInt(res[1] as string) };
}

// === محاسبه برای جفت‌های مستقیم ===
async function calculateDirect(
  from: 'USDT' | 'EDS' | 'VDEP',
  to: 'USDT' | 'EDS' | 'VDEP',
  amount: number
) {
  let pool: string;
  if ((from === 'EDS' && to === 'USDT') || (from === 'USDT' && to === 'EDS')) {
    pool = POOL_ADDRESSES['EDS/USDT'];
  } else if ((from === 'USDT' && to === 'VDEP') || (from === 'VDEP' && to === 'USDT')) {
    pool = POOL_ADDRESSES['USDT/VDEP'];
  } else {
    return null;
  }

  const actual = await getDirectAmountOut(pool, from, amount);
  const reserves = await getReserves(pool);

  const isFromToken0 = 
    (pool === POOL_ADDRESSES['EDS/USDT'] && from === 'EDS') ||
    (pool === POOL_ADDRESSES['USDT/VDEP'] && from === 'USDT');

  const reserveIn = isFromToken0 ? reserves.r0 : reserves.r1;
  const reserveOut = isFromToken0 ? reserves.r1 : reserves.r0;
  const decimalsIn = DECIMALS[from];
  const decimalsOut = DECIMALS[to];

  const marketPrice = (Number(reserveOut) / 10**decimalsOut) / (Number(reserveIn) / 10**decimalsIn);
  const marketExpected = amount * marketPrice;
  const totalSlippage = ((marketExpected - actual) / marketExpected) * 100;

  return {
    marketExpected,
    idealAmount: marketExpected,
    actualAmount: actual,
    totalSlippage,
    feeSlippage: totalSlippage,
  };
}

// === محاسبه multi-hop: EDS ↔ VDEP ===
async function calculateMultiHop(
  from: 'EDS' | 'VDEP',
  to: 'VDEP' | 'EDS',
  amount: number
) {
  // مرحله 1: به USDT
  const step1 = await calculateDirect(from, 'USDT', amount);
  if (!step1) return null;

  // مرحله 2: از USDT به مقصد
  const step2 = await calculateDirect('USDT', to, step1.actualAmount);
  if (!step2) return null;

  // محاسبه marketExpected بر اساس قیمت‌های مستقل
  const reserves1 = await getReserves(POOL_ADDRESSES['EDS/USDT']);
  const reserves2 = await getReserves(POOL_ADDRESSES['USDT/VDEP']);

  const edsInUSDT = (Number(reserves1.r1) / 1e6) / (Number(reserves1.r0) / 1e8); // USDT per EDS
  const vdepInUSDT = (Number(reserves2.r0) / 1e6) / (Number(reserves2.r1) / 1e8); // USDT per VDEP

  const marketExpected = from === 'EDS'
    ? amount * (edsInUSDT / vdepInUSDT)
    : amount * (vdepInUSDT / edsInUSDT);

  const actualAmount = step2.actualAmount;
  const totalSlippage = ((marketExpected - actualAmount) / marketExpected) * 100;

  return {
    marketExpected,
    idealAmount: marketExpected,
    actualAmount,
    totalSlippage,
    feeSlippage: totalSlippage,
  };
}

// === تابع عمومی ===
export async function calculateSwapLive(
  from: 'USDT' | 'EDS' | 'VDEP',
  to: 'USDT' | 'EDS' | 'VDEP',
  inputAmount: number
) {
  if (from === to) return null;

  // جفت‌های مستقیم
  if (
    (from === 'EDS' && to === 'USDT') ||
    (from === 'USDT' && (to === 'EDS' || to === 'VDEP')) ||
    (from === 'VDEP' && to === 'USDT')
  ) {
    return calculateDirect(from, to, inputAmount);
  }

  // multi-hop: EDS ↔ VDEP
  if ((from === 'EDS' && to === 'VDEP') || (from === 'VDEP' && to === 'EDS')) {
    return calculateMultiHop(from as 'EDS' | 'VDEP', to as 'VDEP' | 'EDS', inputAmount);
  }

  return null;
}

export type SwapResult = {
  marketExpected: number;
  idealAmount: number;
  actualAmount: number;
  totalSlippage: number;
  feeSlippage: number;
};