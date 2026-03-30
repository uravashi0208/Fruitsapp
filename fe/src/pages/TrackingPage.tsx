/**
 * src/pages/TrackingPage.tsx
 *
 * Public order tracking page — accessible without login.
 * Customers enter their tracking code or order number to see the live timeline.
 */

import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { publicTrackingApi, TrackingTimeline, TrackingEvent } from '../api/admin';

// ── Animations ────────────────────────────────────────────────────────────────
const fadeUp  = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
const spin    = keyframes`to{transform:rotate(360deg)}`;
const pulse   = keyframes`0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.95)}`;
const shimmer = keyframes`from{background-position:200% center}to{background-position:-200% center}`;
const bounce  = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}`;

// ── Styled components ─────────────────────────────────────────────────────────
const Wrap = styled.div`
  min-height:100vh;
  background:linear-gradient(135deg,#0a0f0a 0%,#0d150d 50%,#0a100a 100%);
  display:flex;flex-direction:column;align-items:center;
  padding:60px 16px 80px;
  font-family:'Inter',-apple-system,sans-serif;
`;

const Logo = styled.div`
  font-size:1.5rem;font-weight:800;color:#82ae46;margin-bottom:48px;
  display:flex;align-items:center;gap:10px;
  span{color:#fff;}
`;

const Hero = styled.div`
  text-align:center;margin-bottom:48px;animation:${fadeUp} .6s ease both;
`;
const HeroTitle = styled.h1`
  font-size:clamp(1.75rem,4vw,2.5rem);font-weight:800;
  color:#fff;margin:0 0 12px;line-height:1.2;
`;
const HeroSub = styled.p`
  font-size:1rem;color:#94a3b8;margin:0;
`;

const SearchBox = styled.div`
  width:100%;max-width:560px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.10);
  border-radius:16px;padding:28px;
  margin-bottom:40px;
  animation:${fadeUp} .6s .1s ease both;
  backdrop-filter:blur(12px);
`;
const SearchLabel = styled.label`
  display:block;font-size:.8125rem;font-weight:600;color:#94a3b8;
  margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px;
`;
const InputRow = styled.div`display:flex;gap:10px;`;
const Input = styled.input`
  flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
  border-radius:10px;padding:12px 16px;color:#f1f5f9;font-size:1rem;outline:none;
  transition:border .2s;
  &:focus{border-color:#82ae46;}
  &::placeholder{color:#475569;}
`;
const SearchBtn = styled.button`
  background:#82ae46;color:#fff;border:none;border-radius:10px;
  padding:12px 24px;font-size:.9375rem;font-weight:700;cursor:pointer;
  transition:all .2s;white-space:nowrap;
  &:hover{filter:brightness(1.1);transform:translateY(-1px);}
  &:disabled{opacity:.5;cursor:not-allowed;transform:none;}
`;

const ErrorMsg = styled.div`
  width:100%;max-width:560px;background:rgba(239,68,68,.1);
  border:1px solid rgba(239,68,68,.3);border-radius:10px;
  padding:12px 18px;color:#f87171;font-size:.875rem;margin-bottom:24px;
  display:flex;align-items:center;gap:8px;
`;

const Spinner = styled.div`
  width:40px;height:40px;border:3px solid rgba(130,174,70,.2);
  border-top-color:#82ae46;border-radius:50%;
  animation:${spin} .75s linear infinite;margin:48px auto;
`;

// ── Result card ───────────────────────────────────────────────────────────────
const ResultCard = styled.div`
  width:100%;max-width:700px;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
  border-radius:16px;overflow:hidden;
  animation:${fadeUp} .4s ease both;
`;
const ResultHead = styled.div`
  background:rgba(130,174,70,.1);border-bottom:1px solid rgba(130,174,70,.2);
  padding:20px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
`;
const OrderNumDisplay = styled.div`
  font-size:.8125rem;color:#82ae46;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px;
`;
const StatusBig = styled.div<{$color?:string}>`
  font-size:1.125rem;font-weight:700;color:${p=>p.$color||'#82ae46'};
  display:flex;align-items:center;gap:8px;
`;

const TrackCodeBox = styled.div`
  display:flex;align-items:center;gap:10px;
  background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);
  border-radius:8px;padding:8px 14px;
`;
const TrackCodeLabel = styled.div`font-size:.7rem;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:2px;`;
const TrackCodeVal   = styled.div`font-family:monospace;font-size:.9375rem;font-weight:700;color:#06b6d4;letter-spacing:2px;`;

// ── Progress steps ────────────────────────────────────────────────────────────
const STEPS = [
  { key:'pending',    icon:'📋', label:'Order Placed'   },
  { key:'confirmed',  icon:'✅', label:'Confirmed'      },
  { key:'processing', icon:'📦', label:'Being Prepared' },
  { key:'shipped',    icon:'🚚', label:'On the Way'     },
  { key:'delivered',  icon:'🎉', label:'Delivered!'     },
];
const STATUS_COLORS: Record<string,string> = {
  pending:'#f59e0b', confirmed:'#3b82f6', processing:'#8b5cf6',
  shipped:'#06b6d4', delivered:'#10b981', cancelled:'#ef4444',
};

const StepWrap = styled.div`
  padding:24px 28px;border-bottom:1px solid rgba(255,255,255,.07);
  overflow-x:auto;
`;
const StepRow = styled.div`display:flex;align-items:center;min-width:360px;`;
const StepItem = styled.div<{$done?:boolean;$active?:boolean}>`
  display:flex;flex-direction:column;align-items:center;gap:6px;min-width:80px;
  .icon-wrap{
    width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:1.25rem;border:2px solid;transition:all .4s;
    border-color:${p=>p.$done||p.$active?'#82ae46':'rgba(255,255,255,.12)'};
    background:${p=>p.$done?'rgba(130,174,70,.25)':p.$active?'rgba(130,174,70,.15)':'transparent'};
    ${p=>p.$active?`animation:${bounce} 2s ease infinite;`:''}
  }
  .step-label{
    font-size:.6875rem;font-weight:600;text-align:center;white-space:nowrap;
    color:${p=>p.$done||p.$active?'#82ae46':'#475569'};
  }
`;
const StepConn = styled.div<{$done?:boolean}>`
  flex:1;height:2px;min-width:16px;margin-bottom:22px;
  background:${p=>p.$done?'#82ae46':'rgba(255,255,255,.1)'};
  transition:background .4s;
`;

// ── Timeline ──────────────────────────────────────────────────────────────────
const TimelineWrap = styled.div`padding:24px 28px;`;
const TimelineHead = styled.div`font-size:.8125rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:20px;`;
const TL = styled.div`position:relative;padding-left:28px;`;
const TLLine = styled.div`
  position:absolute;left:8px;top:0;bottom:0;width:2px;
  background:linear-gradient(to bottom,#82ae46 0%,rgba(255,255,255,.06) 100%);
`;
const TLItem = styled.div`position:relative;margin-bottom:24px;&:last-child{margin-bottom:0;}`;
const TLDot = styled.div<{$color?:string;$active?:boolean}>`
  position:absolute;left:-22px;top:3px;
  width:16px;height:16px;border-radius:50%;
  background:${p=>p.$color||'#82ae46'};
  border:2px solid #0a0f0a;
  box-shadow:0 0 0 3px ${p=>p.$color||'#82ae46'}33;
  ${p=>p.$active?`animation:${pulse} 2s ease infinite;`:''}
`;
const TLTitle = styled.div`font-size:.9375rem;font-weight:600;color:#f1f5f9;`;
const TLNote  = styled.div`font-size:.8125rem;color:#94a3b8;margin-top:3px;`;
const TLMeta  = styled.div`margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;`;
const TLTime  = styled.span`font-size:.75rem;color:#475569;`;
const TLTag   = styled.span<{$color?:string}>`
  font-size:.7rem;font-weight:700;padding:2px 9px;border-radius:20px;
  background:${p=>p.$color?p.$color+'22':'rgba(130,174,70,.15)'};
  color:${p=>p.$color||'#82ae46'};
`;
const TLLoc = styled.div`font-size:.8125rem;color:#64748b;margin-top:3px;display:flex;align-items:center;gap:4px;`;

// ── Est delivery banner ───────────────────────────────────────────────────────
const DeliveryBanner = styled.div`
  margin:0 28px 0;padding:12px 18px;border-radius:10px;
  background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);
  color:#10b981;font-size:.875rem;font-weight:600;display:flex;gap:8px;align-items:center;
  margin-top:16px;
`;

// ── Carrier link ──────────────────────────────────────────────────────────────
const CarrierLink = styled.a`
  display:inline-flex;align-items:center;gap:6px;color:#06b6d4;
  font-size:.875rem;font-weight:600;text-decoration:none;
  &:hover{text-decoration:underline;}
`;

// ── Tips section ──────────────────────────────────────────────────────────────
const Tips = styled.div`
  width:100%;max-width:700px;margin-top:32px;
  display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;
  animation:${fadeUp} .5s .2s ease both;
`;
const Tip = styled.div`
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);
  border-radius:12px;padding:18px;text-align:center;
`;
const TipIcon = styled.div`font-size:1.75rem;margin-bottom:8px;`;
const TipTitle = styled.div`font-size:.8125rem;font-weight:700;color:#94a3b8;margin-bottom:4px;`;
const TipText  = styled.div`font-size:.75rem;color:#475569;line-height:1.5;`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (s: string) => new Date(s).toLocaleString('en-US', {
  month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit',
});
const fmtDelivery = (s: string) => new Date(s).toLocaleDateString('en-US', {
  weekday:'long', month:'long', day:'numeric',
});

// ── Component ─────────────────────────────────────────────────────────────────
export const TrackingPage: React.FC = () => {
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [result,   setResult]   = useState<TrackingTimeline | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Pre-fill from URL query ?code=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code') || params.get('tracking') || params.get('order');
    if (code) { setInput(code.toUpperCase()); handleSearch(code); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (overrideCode?: string) => {
    const code = (overrideCode || input).trim();
    if (!code) { setError('Please enter a tracking number or order ID.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await publicTrackingApi.lookup(code);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError('No order found for this tracking code. Please double-check and try again.');
      }
    } catch (e: any) {
      setError(e?.message || 'Tracking lookup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Determine progress step
  const status    = result?.status || '';
  const cancelled = status === 'cancelled';
  const activeIdx = STEPS.findIndex(s => s.key === status);
  const tl        = result ? [...(result.timeline || [])].reverse() : [];

  return (
    <Wrap>
      <Logo>🥦 Vege<span>foods</span></Logo>

      <Hero>
        <HeroTitle>Track Your Order</HeroTitle>
        <HeroSub>Enter your tracking code or order number to see real-time delivery updates.</HeroSub>
      </Hero>

      <SearchBox>
        <SearchLabel>Tracking Number or Order ID</SearchLabel>
        <InputRow>
          <Input
            ref={inputRef}
            placeholder="e.g. VGF-X7K2-AB91CD or ORD-1A2B-3C4D"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={onKeyDown}
          />
          <SearchBtn onClick={() => handleSearch()} disabled={loading || !input.trim()}>
            {loading ? '⟳' : '🔍 Track'}
          </SearchBtn>
        </InputRow>
      </SearchBox>

      {error && <ErrorMsg>⚠️ {error}</ErrorMsg>}

      {loading && <Spinner />}

      {result && !loading && (
        <ResultCard>
          {/* Header */}
          <ResultHead>
            <div>
              <OrderNumDisplay>Order {result.orderNumber}</OrderNumDisplay>
              <StatusBig $color={cancelled ? '#ef4444' : STATUS_COLORS[status] || '#82ae46'}>
                {result.statusLabels?.[status]?.icon || '●'}{' '}
                {result.statusLabels?.[status]?.label || status}
              </StatusBig>
            </div>
            {result.trackingCode && (
              <TrackCodeBox>
                <div>
                  <TrackCodeLabel>Tracking Code</TrackCodeLabel>
                  <TrackCodeVal>{result.trackingCode}</TrackCodeVal>
                </div>
              </TrackCodeBox>
            )}
          </ResultHead>

          {/* Estimated delivery */}
          {result.estimatedDelivery && !cancelled && (
            <DeliveryBanner>
              📅 Estimated Delivery: <strong>{fmtDelivery(result.estimatedDelivery)}</strong>
            </DeliveryBanner>
          )}

          {/* Carrier link */}
          {result.carrierInfo?.trackingUrl && (
            <div style={{padding:'12px 28px 0'}}>
              <CarrierLink href={result.carrierInfo.trackingUrl} target="_blank" rel="noopener noreferrer">
                🔗 Track on {result.carrierInfo.label} website ↗
              </CarrierLink>
            </div>
          )}

          {/* Progress steps */}
          {!cancelled && (
            <StepWrap>
              <StepRow>
                {STEPS.map((s, i) => (
                  <React.Fragment key={s.key}>
                    <StepItem $done={i < activeIdx} $active={i === activeIdx}>
                      <div className="icon-wrap">{s.icon}</div>
                      <div className="step-label">{s.label}</div>
                    </StepItem>
                    {i < STEPS.length - 1 && <StepConn $done={i < activeIdx} />}
                  </React.Fragment>
                ))}
              </StepRow>
            </StepWrap>
          )}

          {cancelled && (
            <div style={{padding:'18px 28px',background:'rgba(239,68,68,.06)',borderBottom:'1px solid rgba(239,68,68,.15)',color:'#f87171',fontSize:'.875rem'}}>
              ❌ This order has been cancelled. Please contact support if you have questions.
            </div>
          )}

          {/* Timeline */}
          <TimelineWrap>
            <TimelineHead>📍 Delivery Updates</TimelineHead>
            {tl.length === 0 ? (
              <div style={{color:'#475569',fontSize:'.875rem',textAlign:'center',padding:'20px 0'}}>
                No tracking events yet — check back soon!
              </div>
            ) : (
              <TL>
                <TLLine />
                {tl.map((ev: TrackingEvent, i: number) => {
                  const isLatest = i === 0;
                  const color    = STATUS_COLORS[ev.status] || '#64748b';
                  return (
                    <TLItem key={ev.id || i}>
                      <TLDot $color={color} $active={isLatest} />
                      <TLTitle>{ev.note || ev.status}</TLTitle>
                      {ev.location && <TLLoc>📍 {ev.location}</TLLoc>}
                      <TLMeta>
                        <TLTime>{fmtDate(ev.timestamp)}</TLTime>
                        {ev.status && ev.status !== 'update' && (
                          <TLTag $color={color}>{result.statusLabels?.[ev.status]?.label || ev.status}</TLTag>
                        )}
                      </TLMeta>
                    </TLItem>
                  );
                })}
              </TL>
            )}
          </TimelineWrap>
        </ResultCard>
      )}

      {/* Tips */}
      {!result && !loading && (
        <Tips>
          <Tip>
            <TipIcon>📧</TipIcon>
            <TipTitle>Check Your Email</TipTitle>
            <TipText>Your tracking code was sent to your email when the order was shipped.</TipText>
          </Tip>
          <Tip>
            <TipIcon>🔢</TipIcon>
            <TipTitle>Order Number</TipTitle>
            <TipText>You can also use your order number (e.g. ORD-1A2B) to look up your shipment.</TipText>
          </Tip>
          <Tip>
            <TipIcon>⏱️</TipIcon>
            <TipTitle>Processing Time</TipTitle>
            <TipText>Orders are typically processed within 24 hours of placement.</TipText>
          </Tip>
          <Tip>
            <TipIcon>💬</TipIcon>
            <TipTitle>Need Help?</TipTitle>
            <TipText>Contact our support team if you have trouble locating your order.</TipText>
          </Tip>
        </Tips>
      )}
    </Wrap>
  );
};

export default TrackingPage;
