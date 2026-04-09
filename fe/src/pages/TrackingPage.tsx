/**
 * src/pages/TrackingPage.tsx
 *
 * Public order tracking page — themed to Vegefoods storefront
 * (Poppins · #82ae46 primary · white/light bg · 30px pill radii)
 */

import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { fadeUp, spin, pulse, bounceIn as bounce } from '../styles/animations';
import { Search, Package, CheckCircle2, ClipboardList, Truck, PartyPopper, MapPin, Clock, Mail, Hash, HeadphonesIcon } from 'lucide-react';
import { publicTrackingApi, TrackingTimeline, TrackingEvent } from '../api/admin';
import { PageHero } from '../components/ui/PageHero';
import { theme as t } from '../styles/theme';
import { Container, Button } from '../styles/shared';

// ── Animations ────────────────────────────────────────────────────────────────

// ── Status map ────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending:    '#f79009',
  confirmed:  '#0ba5ec',
  processing: '#7c3aed',
  shipped:    '#0891b2',
  delivered:  t.colors.primary,
  cancelled:  t.colors.danger,
};

// ── Search section ────────────────────────────────────────────────────────────
const SearchSection = styled.div`
  background: ${t.colors.surface};
  padding: 48px 0 0;
`;

const SearchCard = styled.div`
  background: white;
  border: 1px solid ${t.colors.border};
  border-radius: 8px;
  padding: 36px 40px;
  box-shadow: ${t.shadows.md};
  max-width: 680px;
  margin: 0 auto;
  animation: ${fadeUp} 0.5s ease both;
  @media (max-width: ${t.breakpoints.sm}) { padding: 24px 20px; }
`;

const SearchTitle = styled.h2`
  font-family: ${t.fonts.body};
  font-size: 1.375rem;
  font-weight: ${t.fontWeights.semibold};
  color: ${t.colors.textDark};
  margin: 0 0 6px;
`;
const SearchSub = styled.p`
  font-size: ${t.fontSizes.base};
  color: ${t.colors.text};
  margin: 0 0 24px;
`;

const InputLabel = styled.label`
  display: block;
  font-size: ${t.fontSizes.sm};
  font-weight: ${t.fontWeights.medium};
  color: ${t.colors.textDark};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 10px;
`;

const InputRow = styled.div`
  display: flex;
  gap: 10px;
  @media (max-width: ${t.breakpoints.xs}) { flex-direction: column; }
`;

const TrackInput = styled.input`
  flex: 1;
  padding: 12px 20px;
  border: 1px solid ${t.colors.borderMid};
  border-radius: ${t.radii.lg};
  font-family: ${t.fonts.body};
  font-size: ${t.fontSizes.base};
  color: ${t.colors.textDark};
  outline: none;
  transition: ${t.transitions.fast};
  background: white;
  &::placeholder { color: rgba(0,0,0,0.28); }
  &:focus { border-color: ${t.colors.primary}; box-shadow: 0 0 0 3px ${t.colors.primaryGhost}; }
`;

const TrackBtn = styled(Button)`
  padding: 12px 28px;
  font-size: ${t.fontSizes.base};
  white-space: nowrap;
  gap: 8px;
`;

const ErrorBox = styled.div`
  max-width: 680px;
  margin: 16px auto 0;
  background: rgba(220,53,69,.07);
  border: 1px solid rgba(220,53,69,.25);
  border-radius: 8px;
  padding: 12px 18px;
  color: ${t.colors.danger};
  font-size: ${t.fontSizes.base};
  display: flex;
  align-items: center;
  gap: 8px;
  animation: ${fadeUp} 0.3s ease both;
`;

const SpinnerWrap = styled.div`
  display: flex;
  justify-content: center;
  padding: 60px 0;
`;
const Spinner = styled.div`
  width: 40px; height: 40px;
  border: 3px solid ${t.colors.border};
  border-top-color: ${t.colors.primary};
  border-radius: 50%;
  animation: ${spin} .75s linear infinite;
`;

// ── Result layout ─────────────────────────────────────────────────────────────
const ResultSection = styled.div`
  padding: 40px 0 60px;
  animation: ${fadeUp} 0.4s ease both;
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
  @media (max-width: ${t.breakpoints.lg}) { grid-template-columns: 1fr; }
`;

const Card = styled.div<{ $noPad?: boolean }>`
  background: white;
  border: 1px solid ${t.colors.border};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: ${t.shadows.sm};
  ${({ $noPad }) => !$noPad && css`padding: 28px 28px;`}
`;

const CardHead = styled.div`
  padding: 18px 24px;
  border-bottom: 1px solid ${t.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const CardTitle = styled.h3`
  font-family: ${t.fonts.body};
  font-size: 0.9375rem;
  font-weight: ${t.fontWeights.semibold};
  color: ${t.colors.textDark};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const CardBody = styled.div`padding: 24px;`;

// ── Order summary header ──────────────────────────────────────────────────────
const OrderHeader = styled.div`
  background: ${t.colors.primaryGhost};
  border-bottom: 2px solid ${t.colors.primary}22;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`;

const OrderNumLabel = styled.div`
  font-size: ${t.fontSizes.xs};
  font-weight: ${t.fontWeights.semibold};
  color: ${t.colors.primary};
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 4px;
`;

const OrderStatusText = styled.div<{ $color?: string }>`
  font-size: 1.125rem;
  font-weight: ${t.fontWeights.semibold};
  color: ${p => p.$color || t.colors.primary};
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${t.fonts.body};
`;

const StatusBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  border-radius: ${t.radii.lg};
  font-size: ${t.fontSizes.xs};
  font-weight: ${t.fontWeights.semibold};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: ${p => p.$color}18;
  color: ${p => p.$color};
  border: 1px solid ${p => p.$color}33;
`;

const TrackCodeBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(11,165,236,.07);
  border: 1px solid rgba(11,165,236,.2);
  border-radius: 8px;
  padding: 10px 16px;
`;
const TrackCodeLabel = styled.div`
  font-size: 10px;
  color: ${t.colors.text};
  font-weight: ${t.fontWeights.semibold};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 2px;
`;
const TrackCodeVal = styled.div`
  font-family: ${t.fonts.mono};
  font-size: 0.9375rem;
  font-weight: ${t.fontWeights.bold};
  color: #0891b2;
  letter-spacing: 2px;
`;

// ── Progress steps ────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'pending',    Icon: ClipboardList, label: 'Placed'    },
  { key: 'confirmed',  Icon: CheckCircle2,  label: 'Confirmed' },
  { key: 'processing', Icon: Package,       label: 'Preparing' },
  { key: 'shipped',    Icon: Truck,         label: 'On the Way'},
  { key: 'delivered',  Icon: PartyPopper,   label: 'Delivered' },
];

const StepRow = styled.div`
  display: flex;
  align-items: center;
  overflow-x: auto;
  padding: 4px 0 8px;
`;

const StepItem = styled.div<{ $done?: boolean; $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 80px;

  .step-circle {
    width: 46px; height: 46px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid;
    transition: all ${t.transitions.base};
    border-color: ${p => p.$done || p.$active ? t.colors.primary : t.colors.borderMid};
    background:   ${p => p.$done ? t.colors.primary : p.$active ? t.colors.primaryGhost : 'white'};
    color:        ${p => p.$done ? 'white' : p.$active ? t.colors.primary : t.colors.text};
    box-shadow:   ${p => p.$active ? t.shadows.hover : 'none'};
    ${p => p.$active && css`animation: ${bounce} 2s ease infinite;`}
  }

  .step-label {
    font-size: 0.6875rem;
    font-weight: ${t.fontWeights.semibold};
    text-align: center;
    white-space: nowrap;
    color: ${p => p.$done || p.$active ? t.colors.primary : t.colors.text};
    letter-spacing: 0.3px;
  }
`;

const StepLine = styled.div<{ $done?: boolean }>`
  flex: 1;
  height: 2px;
  min-width: 14px;
  margin-bottom: 28px;
  border-radius: 2px;
  background: ${p => p.$done ? t.colors.primary : t.colors.border};
  transition: background ${t.transitions.base};
`;

// ── Delivery info banner ──────────────────────────────────────────────────────
const DeliveryBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(130,174,70,.08);
  border: 1px solid ${t.colors.primary}33;
  border-radius: 8px;
  padding: 12px 18px;
  margin-bottom: 20px;
  font-size: ${t.fontSizes.base};
  color: ${t.colors.primaryDark};
  font-weight: ${t.fontWeights.medium};
`;

const CancelledBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(220,53,69,.06);
  border: 1px solid rgba(220,53,69,.2);
  border-radius: 8px;
  padding: 12px 18px;
  margin-bottom: 20px;
  font-size: ${t.fontSizes.base};
  color: ${t.colors.danger};
  font-weight: ${t.fontWeights.medium};
`;

const CarrierLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${t.colors.primary};
  font-size: ${t.fontSizes.base};
  font-weight: ${t.fontWeights.medium};
  text-decoration: none;
  margin-bottom: 20px;
  transition: ${t.transitions.fast};
  &:hover { color: ${t.colors.primaryDark}; text-decoration: underline; }
`;

// ── Timeline ──────────────────────────────────────────────────────────────────
const TL = styled.div`position: relative; padding-left: 28px;`;
const TLLine = styled.div`
  position: absolute;
  left: 7px; top: 6px; bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, ${t.colors.primary} 0%, ${t.colors.border} 85%);
  border-radius: 2px;
`;
const TLItem = styled.div`
  position: relative;
  margin-bottom: 24px;
  &:last-child { margin-bottom: 0; }
`;
const TLDot = styled.div<{ $color?: string; $active?: boolean }>`
  position: absolute;
  left: -28px; top: 0px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: ${p => p.$color || t.colors.primary};
  border: 2px solid white;
  box-shadow: 0 0 0 3px ${p => p.$color ? `${p.$color}33` : t.colors.primaryGhost};
  ${p => p.$active && css`animation: ${pulse} 2s ease infinite;`}
`;
const TLTitle = styled.div`
  font-size: ${t.fontSizes.base};
  font-weight: ${t.fontWeights.medium};
  color: ${t.colors.textDark};
  line-height: 1.4;
`;
const TLMeta = styled.div`
  margin-top: 5px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;
const TLTime = styled.span`
  font-size: ${t.fontSizes.sm};
  color: ${t.colors.text};
  display: flex;
  align-items: center;
  gap: 4px;
`;
const TLTag = styled.span<{ $color?: string }>`
  font-size: 10px;
  font-weight: ${t.fontWeights.semibold};
  padding: 2px 10px;
  border-radius: ${t.radii.lg};
  letter-spacing: 0.3px;
  background: ${p => p.$color ? `${p.$color}18` : t.colors.primaryGhost};
  color: ${p => p.$color || t.colors.primary};
  text-transform: uppercase;
`;
const TLLoc = styled.div`
  font-size: ${t.fontSizes.sm};
  color: ${t.colors.text};
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

// ── Sidebar info ──────────────────────────────────────────────────────────────
const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${t.colors.border};
  &:last-child { border-bottom: none; padding-bottom: 0; }
`;
const InfoIcon = styled.div`
  width: 36px; height: 36px;
  border-radius: 50%;
  background: ${t.colors.primaryGhost};
  color: ${t.colors.primary};
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
`;
const InfoLabel = styled.div`
  font-size: ${t.fontSizes.xs};
  color: ${t.colors.text};
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: ${t.fontWeights.semibold};
  margin-bottom: 2px;
`;
const InfoValue = styled.div`
  font-size: ${t.fontSizes.base};
  color: ${t.colors.textDark};
  font-weight: ${t.fontWeights.medium};
  word-break: break-all;
`;

// ── Tips ──────────────────────────────────────────────────────────────────────
const TipsSection = styled.div`
  padding: 48px 0 60px;
  background: ${t.colors.offWhite};
  animation: ${fadeUp} 0.5s 0.15s ease both;
`;

const TipsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  @media (max-width: ${t.breakpoints.lg}) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: ${t.breakpoints.xs}) { grid-template-columns: 1fr; }
`;

const TipCard = styled.div`
  background: white;
  border: 1px solid ${t.colors.border};
  border-radius: 8px;
  padding: 24px 20px;
  text-align: center;
  transition: ${t.transitions.base};
  &:hover { box-shadow: ${t.shadows.hover}; transform: translateY(-3px); }
`;
const TipIconWrap = styled.div`
  width: 52px; height: 52px;
  border-radius: 50%;
  background: ${t.colors.primaryGhost};
  color: ${t.colors.primary};
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
`;
const TipTitle = styled.div`
  font-size: ${t.fontSizes.base};
  font-weight: ${t.fontWeights.semibold};
  color: ${t.colors.textDark};
  margin-bottom: 6px;
`;
const TipText = styled.div`
  font-size: ${t.fontSizes.sm};
  color: ${t.colors.text};
  line-height: 1.6;
`;

// ── Divider strip between search card and result ──────────────────────────────
const Strip = styled.div`
  height: 3px;
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (s: string) => new Date(s).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});
const fmtDelivery = (s: string) => new Date(s).toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
});

// ── Component ─────────────────────────────────────────────────────────────────
export const TrackingPage: React.FC = () => {
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [result,  setResult]  = useState<TrackingTimeline | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

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

  const status    = result?.status || '';
  const cancelled = status === 'cancelled';
  const activeIdx = STEPS.findIndex(s => s.key === status);
  const tl        = result ? [...(result.timeline || [])].reverse() : [];

  return (
    <>
      <PageHero title="Track Order" breadcrumbs={[{ label: 'Track Order' }]} />

      {/* ── Search card ── */}
      <SearchSection>
        <Container>
          <SearchCard>
            <SearchTitle>Track Your Shipment</SearchTitle>
            <SearchSub>Enter your tracking code or order number to get real-time delivery updates.</SearchSub>
            <InputLabel>Tracking Number or Order ID</InputLabel>
            <InputRow>
              <TrackInput
                ref={inputRef}
                placeholder="e.g. VGF-X7K2-AB91CD or ORD-1A2B-3C4D"
                value={input}
                onChange={e => setInput(e.target.value.toUpperCase())}
                onKeyDown={onKeyDown}
              />
              <TrackBtn onClick={() => handleSearch()} disabled={loading || !input.trim()}>
                <Search size={15} />
                {loading ? 'Searching…' : 'Track'}
              </TrackBtn>
            </InputRow>
          </SearchCard>

          {error && (
            <ErrorBox>
              <span style={{ fontSize: '1rem' }}>⚠️</span> {error}
            </ErrorBox>
          )}
        </Container>
        <Strip style={{ marginTop: 40 }} />
      </SearchSection>

      {/* ── Spinner ── */}
      {loading && (
        <SpinnerWrap>
          <Spinner />
        </SpinnerWrap>
      )}

      {/* ── Result ── */}
      {result && !loading && (
        <ResultSection>
          <Container>
            <ResultGrid>
              {/* Left — timeline card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Order header */}
                <Card $noPad>
                  <OrderHeader>
                    <div>
                      <OrderNumLabel>Order Number</OrderNumLabel>
                      <OrderStatusText $color={cancelled ? t.colors.danger : STATUS_COLORS[status]}>
                        {result.statusLabels?.[status]?.icon || '●'}&nbsp;
                        {result.statusLabels?.[status]?.label || status}
                      </OrderStatusText>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <StatusBadge $color={cancelled ? t.colors.danger : STATUS_COLORS[status] || t.colors.primary}>
                        {result.orderNumber}
                      </StatusBadge>
                      {result.trackingCode && (
                        <TrackCodeBox>
                          <div>
                            <TrackCodeLabel>Tracking Code</TrackCodeLabel>
                            <TrackCodeVal>{result.trackingCode}</TrackCodeVal>
                          </div>
                        </TrackCodeBox>
                      )}
                    </div>
                  </OrderHeader>

                  <CardBody>
                    {/* Delivery / cancelled banners */}
                    {result.estimatedDelivery && !cancelled && (
                      <DeliveryBanner>
                        <span style={{ fontSize: '1.1rem' }}>📅</span>
                        Estimated Delivery:&nbsp;<strong>{fmtDelivery(result.estimatedDelivery)}</strong>
                      </DeliveryBanner>
                    )}
                    {cancelled && (
                      <CancelledBanner>
                        <span style={{ fontSize: '1.1rem' }}>❌</span>
                        This order has been cancelled. Please contact support if you have questions.
                      </CancelledBanner>
                    )}

                    {/* Carrier link */}
                    {result.carrierInfo?.trackingUrl && (
                      <div style={{ marginBottom: 20 }}>
                        <CarrierLink href={result.carrierInfo.trackingUrl} target="_blank" rel="noopener noreferrer">
                          🔗 Track on {result.carrierInfo.label} website ↗
                        </CarrierLink>
                      </div>
                    )}

                    {/* Progress steps */}
                    {!cancelled && (
                      <div style={{ marginBottom: 28 }}>
                        <div style={{ fontSize: t.fontSizes.xs, fontWeight: t.fontWeights.semibold, color: t.colors.text, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>
                          Order Progress
                        </div>
                        <StepRow>
                          {STEPS.map((s, i) => (
                            <React.Fragment key={s.key}>
                              <StepItem $done={i < activeIdx} $active={i === activeIdx}>
                                <div className="step-circle">
                                  <s.Icon size={18} strokeWidth={2} />
                                </div>
                                <div className="step-label">{s.label}</div>
                              </StepItem>
                              {i < STEPS.length - 1 && <StepLine $done={i < activeIdx} />}
                            </React.Fragment>
                          ))}
                        </StepRow>
                      </div>
                    )}

                    {/* Timeline */}
                    <div style={{ fontSize: t.fontSizes.xs, fontWeight: t.fontWeights.semibold, color: t.colors.text, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>
                      Delivery Updates
                    </div>
                    {tl.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '28px 0', color: t.colors.text, fontSize: t.fontSizes.base }}>
                        No tracking events yet — check back soon!
                      </div>
                    ) : (
                      <TL>
                        <TLLine />
                        {tl.map((ev: TrackingEvent, i: number) => {
                          const isLatest = i === 0;
                          const color    = STATUS_COLORS[ev.status] || t.colors.text;
                          return (
                            <TLItem key={ev.id || i}>
                              <TLDot $color={color} $active={isLatest} />
                              <TLTitle>{ev.note || ev.status}</TLTitle>
                              {ev.location && (
                                <TLLoc>
                                  <MapPin size={12} />
                                  {ev.location}
                                </TLLoc>
                              )}
                              <TLMeta>
                                <TLTime>
                                  <Clock size={11} />
                                  {fmtDate(ev.timestamp)}
                                </TLTime>
                                {ev.status && ev.status !== 'update' && (
                                  <TLTag $color={color}>
                                    {result.statusLabels?.[ev.status]?.label || ev.status}
                                  </TLTag>
                                )}
                              </TLMeta>
                            </TLItem>
                          );
                        })}
                      </TL>
                    )}
                  </CardBody>
                </Card>
              </div>

              {/* Right — order info sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Card $noPad>
                  <CardHead>
                    <CardTitle>
                      <Package size={15} />
                      Order Details
                    </CardTitle>
                  </CardHead>
                  <CardBody>
                    <InfoRow>
                      <InfoItem>
                        <InfoIcon><Hash size={16} /></InfoIcon>
                        <div>
                          <InfoLabel>Order Number</InfoLabel>
                          <InfoValue style={{ fontFamily: t.fonts.mono, letterSpacing: '0.5px' }}>
                            {result.orderNumber}
                          </InfoValue>
                        </div>
                      </InfoItem>
                      {result.trackingCode && (
                        <InfoItem>
                          <InfoIcon><Package size={16} /></InfoIcon>
                          <div>
                            <InfoLabel>Tracking Code</InfoLabel>
                            <InfoValue style={{ fontFamily: t.fonts.mono, color: '#0891b2', letterSpacing: '1px' }}>
                              {result.trackingCode}
                            </InfoValue>
                          </div>
                        </InfoItem>
                      )}
                      <InfoItem>
                        <InfoIcon><Truck size={16} /></InfoIcon>
                        <div>
                          <InfoLabel>Current Status</InfoLabel>
                          <InfoValue>
                            <StatusBadge $color={cancelled ? t.colors.danger : STATUS_COLORS[status] || t.colors.primary}>
                              {result.statusLabels?.[status]?.label || status}
                            </StatusBadge>
                          </InfoValue>
                        </div>
                      </InfoItem>
                      {result.estimatedDelivery && !cancelled && (
                        <InfoItem>
                          <InfoIcon><Clock size={16} /></InfoIcon>
                          <div>
                            <InfoLabel>Est. Delivery</InfoLabel>
                            <InfoValue>{fmtDelivery(result.estimatedDelivery)}</InfoValue>
                          </div>
                        </InfoItem>
                      )}
                      {result.carrierInfo && (
                        <InfoItem>
                          <InfoIcon><Truck size={16} /></InfoIcon>
                          <div>
                            <InfoLabel>Carrier</InfoLabel>
                            <InfoValue>{result.carrierInfo.label}</InfoValue>
                          </div>
                        </InfoItem>
                      )}
                    </InfoRow>
                  </CardBody>
                </Card>

                {/* Need help */}
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: t.colors.primaryGhost, color: t.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <HeadphonesIcon size={22} />
                    </div>
                    <div style={{ fontWeight: t.fontWeights.semibold, color: t.colors.textDark, marginBottom: 6, fontSize: t.fontSizes.base }}>
                      Need Help?
                    </div>
                    <div style={{ fontSize: t.fontSizes.sm, color: t.colors.text, marginBottom: 16, lineHeight: 1.6 }}>
                      Can't find your order or have questions about your delivery?
                    </div>
                    <Button as="a" href="/contact" $variant="outline" style={{ fontSize: t.fontSizes.sm, padding: '9px 22px' }}>
                      Contact Support
                    </Button>
                  </div>
                </Card>
              </div>
            </ResultGrid>
          </Container>
        </ResultSection>
      )}

      {/* ── Tips (shown when no result yet) ── */}
      {!result && !loading && (
        <TipsSection>
          <Container>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: t.fontSizes.xs, fontWeight: t.fontWeights.semibold, color: t.colors.primary, textTransform: 'uppercase', letterSpacing: '3px' }}>
                Helpful Tips
              </span>
              <h2 style={{ fontFamily: t.fonts.body, fontSize: '1.5rem', fontWeight: t.fontWeights.semibold, color: t.colors.textDark, margin: '8px 0 0' }}>
                How to Track Your Order
              </h2>
            </div>
            <TipsGrid>
              <TipCard>
                <TipIconWrap><Mail size={22} /></TipIconWrap>
                <TipTitle>Check Your Email</TipTitle>
                <TipText>Your tracking code was emailed to you when your order was shipped.</TipText>
              </TipCard>
              <TipCard>
                <TipIconWrap><Hash size={22} /></TipIconWrap>
                <TipTitle>Use Order Number</TipTitle>
                <TipText>You can also enter your order number (e.g. ORD-1A2B) to look up your shipment.</TipText>
              </TipCard>
              <TipCard>
                <TipIconWrap><Clock size={22} /></TipIconWrap>
                <TipTitle>Processing Time</TipTitle>
                <TipText>Orders are typically processed and dispatched within 24 hours of placement.</TipText>
              </TipCard>
              <TipCard>
                <TipIconWrap><HeadphonesIcon size={22} /></TipIconWrap>
                <TipTitle>Need Help?</TipTitle>
                <TipText>Contact our support team if you have trouble locating your order.</TipText>
              </TipCard>
            </TipsGrid>
          </Container>
        </TipsSection>
      )}
    </>
  );
};

export default TrackingPage;