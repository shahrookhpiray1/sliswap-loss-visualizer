import { useState, useEffect } from 'react';
// ❌ حذف: import { calculateSwapLive, SwapResult } from './services/sliswapService';
import { SwapResult } from './services/sliswapService';

import edsLogo from './assets/1.png';
import usdtLogo from './assets/2.png';
import vdepLogo from './assets/3.png';

// ✅ تعریف انواع برای جلوگیری از خطاهای TypeScript
type EdsResults = {
  usdt: SwapResult | null;
  vdep: SwapResult | null;
};

type UsdtResults = {
  eds: SwapResult | null;
  vdep: SwapResult | null;
};

type VdepResults = {
  eds: SwapResult | null;
  usdt: SwapResult | null;
};

/* ========= CONFIG ========= */
const tokenGlow: Record<string, string> = {
  EDS: '#a855f7',
  USDT: '#22c55e',
  VDEP: '#3b82f6',
};

const tokenIcon: Record<string, string> = {
  EDS: edsLogo,
  USDT: usdtLogo,
  VDEP: vdepLogo,
};

const cardStyle = {
  background: '#ffffff',
  padding: '1rem',
  borderRadius: 16,
  minWidth: 230,
  textAlign: 'center' as const,
};

// تابع جدید
async function fetchLiveSwap(from: string, to: string, amount: number) {
  // بدون دامنه — فقط مسیر
  const response = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, amount }),
  });
  return response.json();
}

/* ========= APP ========= */
export default function App() {
  const [eds, setEds] = useState('1');
  const [usdt, setUsdt] = useState('1');
  const [vdep, setVdep] = useState('1');

  const [edsResults, setEdsResults] = useState<EdsResults>({ usdt: null, vdep: null });
  const [usdtResults, setUsdtResults] = useState<UsdtResults>({ eds: null, vdep: null });
  const [vdepResults, setVdepResults] = useState<VdepResults>({ eds: null, usdt: null });

  useEffect(() => {
    const n = parseFloat(eds) || 0;
    if (n > 0) {
      fetchLiveSwap('EDS', 'USDT', n).then(res => {
        setEdsResults(prev => ({ ...prev, usdt: res }));
      });
      fetchLiveSwap('EDS', 'VDEP', n).then(res => {
        setEdsResults(prev => ({ ...prev, vdep: res }));
      });
    } else {
      setEdsResults({ usdt: null, vdep: null });
    }
  }, [eds]);

  useEffect(() => {
    const n = parseFloat(usdt) || 0;
    if (n > 0) {
      fetchLiveSwap('USDT', 'EDS', n).then(res => {
        setUsdtResults(prev => ({ ...prev, eds: res }));
      });
      fetchLiveSwap('USDT', 'VDEP', n).then(res => {
        setUsdtResults(prev => ({ ...prev, vdep: res }));
      });
    } else {
      setUsdtResults({ eds: null, vdep: null });
    }
  }, [usdt]);

  useEffect(() => {
    const n = parseFloat(vdep) || 0;
    if (n > 0) {
      fetchLiveSwap('VDEP', 'EDS', n).then(res => {
        setVdepResults(prev => ({ ...prev, eds: res }));
      });
      fetchLiveSwap('VDEP', 'USDT', n).then(res => {
        setVdepResults(prev => ({ ...prev, usdt: res }));
      });
    } else {
      setVdepResults({ eds: null, usdt: null });
    }
  }, [vdep]);

  return (
    <div style={pageStyle}>
      <div style={mainCardStyle}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          SliSwap Loss Visualizer
        </h1>

        {/* ===== EDS ===== */}
        <SectionGlow color={tokenGlow.EDS}>
          <Row
            token="EDS"
            leftTitle="EDS → USDT"
            rightTitle="EDS → VDEP"
            left={<Swap r={edsResults.usdt} inVal={eds} inTok="EDS" outTok="USDT" />}
            right={<Swap r={edsResults.vdep} inVal={eds} inTok="EDS" outTok="VDEP" />}
          />
          <Input label="EDS" value={eds} onChange={setEds} color={tokenGlow.EDS} />
        </SectionGlow>

        {/* ===== USDT ===== */}
        <SectionGlow color={tokenGlow.USDT}>
          <Row
            token="USDT"
            leftTitle="USDT → EDS"
            rightTitle="USDT → VDEP"
            left={<Swap r={usdtResults.eds} inVal={usdt} inTok="USDT" outTok="EDS" />}
            right={<Swap r={usdtResults.vdep} inVal={usdt} inTok="USDT" outTok="VDEP" />}
          />
          <Input label="USDT" value={usdt} onChange={setUsdt} color={tokenGlow.USDT} />
        </SectionGlow>

        {/* ===== VDEP ===== */}
        <SectionGlow color={tokenGlow.VDEP}>
          <Row
            token="VDEP"
            leftTitle="VDEP → EDS"
            rightTitle="VDEP → USDT"
            left={<Swap r={vdepResults.eds} inVal={vdep} inTok="VDEP" outTok="EDS" />}
            right={<Swap r={vdepResults.usdt} inVal={vdep} inTok="VDEP" outTok="USDT" />}
          />
          <Input label="VDEP" value={vdep} onChange={setVdep} color={tokenGlow.VDEP} />
        </SectionGlow>
      </div>
    </div>
  );
}

/* ========= COMPONENTS ========= */

function SectionGlow({ color, children }: any) {
  return (
    <div
      style={{
        marginBottom: '2.5rem',
        padding: '1.8rem 1.2rem 2.2rem',
        borderRadius: 28,
        border: `3px solid ${color}`,
        boxShadow: `0 0 20px ${color}, 0 0 60px ${color}88`,
      }}
    >
      {children}
    </div>
  );
}

function Row({ token, leftTitle, rightTitle, left, right }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
      <div style={cardStyle}>
        <b>{leftTitle}</b>
        {left}
      </div>

      <div style={iconWrapperStyle(token)}>
        <img src={tokenIcon[token]} style={{ width: 36 }} />
      </div>

      <div style={cardStyle}>
        <b>{rightTitle}</b>
        {right}
      </div>
    </div>
  );
}

function Swap({ r, inVal, inTok, outTok }: any) {
  if (!r) return null;
  return (
    <div style={{ fontSize: '0.8rem', marginTop: 6 }}>
      <div>Input: {inVal} {inTok}</div>
      <div>Market Expected: {r.marketExpected.toFixed(6)} {outTok}</div>
      <div>Ideal: {r.idealAmount.toFixed(6)} {outTok}</div>
      <div>Actual: {r.actualAmount.toFixed(6)} {outTok}</div>
      <div>Total Slippage: {r.totalSlippage.toFixed(6)}%</div>
      <div>Fee Slippage: {r.feeSlippage.toFixed(6)}%</div>
    </div>
  );
}

function Input({ label, value, onChange, color }: any) {
  return (
    <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 220,
          padding: '0.6rem',
          borderRadius: 10,
          border: `3px solid ${color}`,
          boxShadow: `0 0 15px ${color}`,
          textAlign: 'center',
        }}
      />
    </div>
  );
}

/* ========= STYLES ========= */

const pageStyle = {
  width: '100vw',
  height: '100vh',
  background: 'linear-gradient(135deg,#2a0b52,#1b0b3a)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const mainCardStyle = {
  width: '100%',
  maxWidth: 900,
  padding: '2.5rem',
  borderRadius: 40,
  background: '#4b2b78',
  boxShadow: '0 0 80px #a855f7',
};

const iconWrapperStyle = (token: string) => ({
  width: 64,
  height: 64,
  borderRadius: '50%',
  background: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `0 0 20px ${tokenGlow[token]}`,
});