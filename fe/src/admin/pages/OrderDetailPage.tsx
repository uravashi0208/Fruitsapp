/**
 * src/admin/pages/OrderDetailPage.tsx
 *
 * Full order detail view — themed to adminTheme.ts (TailAdmin light palette).
 *  - Order summary (items, totals, payment, address)
 *  - Status pipeline tracker
 *  - Tracking timeline
 *  - Status update / tracking assignment / manual event / admin note
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, CheckCircle2, Package, Truck, PartyPopper, type LucideIcon } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { useDispatch } from 'react-redux';
import {
  adminOrdersApi,
  adminTrackingApi,
  Order,
  TrackingTimeline,
} from '../../api/admin';
import { showAdminToast } from '../store';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminCard,
  AdminBtn,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FormLabel,
  AdminDivider,
} from '../styles/adminShared';

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const spin  = keyframes`to { transform: rotate(360deg); }`;
const pulse = keyframes`0%,100% { opacity: 1; } 50% { opacity: 0.35; }`;

// ── Status colour map ─────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  pending:    { bg: t.colors.warningBg,  fg: t.colors.warning,  border: `${t.colors.warning}44`  },
  confirmed:  { bg: t.colors.infoBg,     fg: t.colors.info,     border: `${t.colors.info}44`     },
  processing: { bg: '#f5f3ff',           fg: '#7c3aed',         border: '#c4b5fd'                },
  shipped:    { bg: '#ecfeff',           fg: '#0891b2',         border: '#a5f3fc'                },
  delivered:  { bg: t.colors.successBg,  fg: t.colors.success,  border: `${t.colors.success}44`  },
  cancelled:  { bg: t.colors.dangerBg,   fg: t.colors.danger,   border: `${t.colors.danger}44`   },
  paid:       { bg: t.colors.successBg,  fg: t.colors.success,  border: `${t.colors.success}44`  },
  refunded:   { bg: t.colors.warningBg,  fg: t.colors.warning,  border: `${t.colors.warning}44`  },
  failed:     { bg: t.colors.dangerBg,   fg: t.colors.danger,   border: `${t.colors.danger}44`   },
};
const getStatusColor = (s: string) =>
  STATUS_COLORS[s] ?? { bg: '#f2f4f7', fg: '#475467', border: '#d0d5dd' };

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: ${t.colors.bg};
  padding: 28px 24px;
  font-family: ${t.fonts.body};
  animation: ${fadeIn} 0.3s ease both;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: ${t.radii.lg};
  border: 1px solid ${t.colors.border};
  background: ${t.colors.surface};
  color: ${t.colors.textSecondary};
  font-family: ${t.fonts.body};
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all ${t.transitions.fast};
  box-shadow: ${t.shadows.xs};
  &:hover {
    border-color: ${t.colors.primary};
    color: ${t.colors.primary};
    background: ${t.colors.primaryGhost};
  }
`;

const TitleBlock = styled.div`display: flex; flex-direction: column; gap: 2px;`;
const PageTitle  = styled.h1`
  font-size: 1.375rem;
  font-weight: 700;
  color: ${t.colors.textPrimary};
  margin: 0;
  letter-spacing: -0.3px;
`;
const OrderMeta = styled.span`
  font-size: 0.8125rem;
  color: ${t.colors.textMuted};
`;

const HeaderRight = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const StatusTag = styled.span<{ $s: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: ${t.radii.full};
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.2px;
  background: ${p => getStatusColor(p.$s).bg};
  color:      ${p => getStatusColor(p.$s).fg};
  border: 1px solid ${p => getStatusColor(p.$s).border};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  @media (max-width: 1100px) { grid-template-columns: 1fr; }
`;
const Col = styled.div`display: flex; flex-direction: column; gap: 20px;`;

// Section card with optional top stripe
const Section = styled(AdminCard)<{ $stripe?: string }>`
  padding: 0;
  overflow: hidden;
  ${({ $stripe }) => $stripe && css`border-top: 3px solid ${$stripe};`}
`;
const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${t.colors.border};
`;
const SectionHeadTitle = styled.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${t.colors.textPrimary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${t.fonts.heading};
`;
const SectionBody = styled.div`padding: 20px;`;

// ── Progress pipeline ─────────────────────────────────────────────────────────
const STEPS: { key: string; icon: LucideIcon; label: string }[] = [
  { key: 'pending',    icon: ClipboardList, label: 'Placed'    },
  { key: 'confirmed',  icon: CheckCircle2,  label: 'Confirmed' },
  { key: 'processing', icon: Package,       label: 'Packing'   },
  { key: 'shipped',    icon: Truck,         label: 'Shipped'   },
  { key: 'delivered',  icon: PartyPopper,   label: 'Delivered' },
];

const StepBar = styled.div`
  display: flex;
  align-items: center;
  overflow-x: auto;
  padding-bottom: 4px;
`;

const StepItem = styled.div<{ $done?: boolean; $active?: boolean; $cancelled?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  .step-icon {
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid;
    transition: all ${t.transitions.base};
    border-color: ${p => p.$cancelled ? t.colors.danger : p.$done || p.$active ? t.colors.primary : t.colors.border};
    background:   ${p => p.$cancelled ? t.colors.dangerBg : p.$done || p.$active ? t.colors.primaryGhost : 'transparent'};
    box-shadow:   ${p => p.$active ? `0 0 0 4px ${t.colors.primaryGhost}` : 'none'};
    color: ${p => p.$cancelled ? t.colors.danger : p.$done || p.$active ? t.colors.primary : t.colors.textMuted};
  }
  .step-label {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: nowrap;
    color: ${p => p.$cancelled ? t.colors.danger : p.$done || p.$active ? t.colors.primary : t.colors.textMuted};
  }
`;
const StepConnector = styled.div<{ $done?: boolean }>`
  flex: 1; height: 2px; min-width: 20px;
  margin-bottom: 22px;
  border-radius: 2px;
  background: ${p => p.$done ? t.colors.primary : t.colors.border};
  transition: background ${t.transitions.base};
`;

const CancelledBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${t.colors.dangerBg};
  border: 1px solid ${t.colors.danger}44;
  border-radius: ${t.radii.lg};
  padding: 12px 18px;
  margin-bottom: 20px;
  color: ${t.colors.danger};
  font-size: 0.875rem;
  font-weight: 600;
`;

// ── Items table ───────────────────────────────────────────────────────────────
const Table = styled.table`width: 100%; border-collapse: collapse;`;
const Th = styled.th`
  text-align: left;
  padding: 10px 14px;
  font-size: 0.6875rem;
  font-weight: 700;
  color: ${t.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${t.colors.surfaceAlt};
  border-bottom: 1px solid ${t.colors.border};
`;
const Td = styled.td`
  padding: 12px 14px;
  font-size: 0.875rem;
  color: ${t.colors.textPrimary};
  border-bottom: 1px solid ${t.colors.border};
  vertical-align: middle;
`;
const ProductImg = styled.img`
  width: 42px; height: 42px;
  border-radius: ${t.radii.md};
  object-fit: cover;
  border: 1px solid ${t.colors.border};
  box-shadow: ${t.shadows.xs};
`;

const SummaryBlock = styled.div`padding: 14px 20px; border-top: 1px solid ${t.colors.border};`;
const SummaryRow   = styled.div<{ $total?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size:   ${p => p.$total ? '0.9375rem' : '0.875rem'};
  font-weight: ${p => p.$total ? '700' : '400'};
  color:       ${p => p.$total ? t.colors.textPrimary : t.colors.textSecondary};
  ${p => p.$total && css`
    border-top: 1px solid ${t.colors.border};
    margin-top: 6px;
    padding-top: 12px;
  `}
`;
const TotalAmt = styled.span`color: ${t.colors.primary}; font-weight: 700;`;

// ── Tracking timeline ─────────────────────────────────────────────────────────
const Timeline = styled.div`position: relative; padding-left: 26px;`;
const TLLine   = styled.div`
  position: absolute;
  left: 7px; top: 6px; bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, ${t.colors.primary}55 0%, ${t.colors.border} 85%);
  border-radius: 2px;
`;
const TLItem  = styled.div`
  position: relative;
  margin-bottom: 22px;
  &:last-child { margin-bottom: 0; }
`;
const TLDot   = styled.div<{ $color?: string; $active?: boolean }>`
  position: absolute;
  left: -22px; top: 3px;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: ${p => p.$color || t.colors.primary};
  border: 2px solid ${t.colors.surface};
  box-shadow: 0 0 0 3px ${p => p.$color ? `${p.$color}33` : t.colors.primaryGhost};
  ${p => p.$active && css`animation: ${pulse} 2s ease infinite;`}
`;
const TLTitle = styled.div`
  font-size: 0.875rem; font-weight: 600;
  color: ${t.colors.textPrimary}; line-height: 1.4;
`;
const TLNote  = styled.div`
  font-size: 0.8125rem; color: ${t.colors.textSecondary}; margin-top: 3px;
`;
const TLMeta  = styled.div`
  font-size: 0.75rem; color: ${t.colors.textMuted};
  margin-top: 5px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
`;
const TLBadge = styled.span<{ $bg?: string; $fg?: string }>`
  background: ${p => p.$bg || t.colors.primaryGhost};
  color:      ${p => p.$fg || t.colors.primary};
  padding: 1px 8px; border-radius: ${t.radii.full};
  font-size: 0.6875rem; font-weight: 600;
`;

// ── Info grid ─────────────────────────────────────────────────────────────────
const InfoGrid  = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;
const InfoItem  = styled.div``;
const InfoLabel = styled.div`
  font-size: 0.6875rem; color: ${t.colors.textMuted};
  font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; margin-bottom: 4px;
`;
const InfoValue = styled.div`
  font-size: 0.875rem; color: ${t.colors.textPrimary}; font-weight: 500;
`;

// ── Tracking code box ─────────────────────────────────────────────────────────
const TrackingCodeBox = styled.div`
  display: flex; align-items: center; gap: 12px;
  background: ${t.colors.primaryGhost};
  border: 1px solid ${t.colors.primary}33;
  border-radius: ${t.radii.lg};
  padding: 12px 16px; margin-bottom: 18px;
`;
const TrackingCodeText = styled.span`
  font-family: ${t.fonts.mono};
  font-size: 1rem; font-weight: 700;
  color: ${t.colors.primary}; letter-spacing: 2px; flex: 1;
`;
const CopyBtn = styled.button`
  background: transparent;
  border: 1px solid ${t.colors.primary}44;
  color: ${t.colors.primary};
  cursor: pointer; font-size: 0.75rem;
  font-family: ${t.fonts.body}; font-weight: 600;
  padding: 4px 10px; border-radius: ${t.radii.md};
  transition: all ${t.transitions.fast};
  &:hover { background: ${t.colors.primary}; color: white; }
`;

const DeliveryBanner = styled.div`
  background: ${t.colors.successBg};
  border: 1px solid ${t.colors.success}44;
  border-radius: ${t.radii.lg};
  padding: 10px 14px; margin-bottom: 18px;
  font-size: 0.8125rem; color: ${t.colors.success};
  font-weight: 500; display: flex; align-items: center; gap: 8px;
`;

// ── Form helpers ──────────────────────────────────────────────────────────────
const FormRow  = styled.div`margin-bottom: 14px;`;
const BtnRow   = styled.div`display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px;`;
const HintText = styled.div`
  font-size: 0.75rem; color: ${t.colors.success}; margin-top: 5px;
  display: flex; align-items: center; gap: 4px;
`;
const FootNote = styled.div`
  font-size: 0.75rem; color: ${t.colors.textMuted}; margin-top: 10px; line-height: 1.5;
`;

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = styled.div`
  width: 36px; height: 36px;
  border: 3px solid ${t.colors.border};
  border-top-color: ${t.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.75s linear infinite;
  margin: 60px auto;
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);

const fmtDate = (s?: string) => {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};
const fmtDateShort = (s?: string) => {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const timelineColor = (status: string) => STATUS_COLORS[status]?.fg ?? t.colors.textMuted;
const stepIndex     = (status: string) => STEPS.findIndex(s => s.key === status);

// ── Component ─────────────────────────────────────────────────────────────────
export const OrderDetailPage: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [order,    setOrder]    = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TrackingTimeline | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const [newStatus,   setNewStatus]   = useState('');
  const [statusNote,  setStatusNote]  = useState('');
  const [trkCode,     setTrkCode]     = useState('');
  const [carrierCode, setCarrierCode] = useState('');
  const [estDelivery, setEstDelivery] = useState('');
  const [trkNote,     setTrkNote]     = useState('');
  const [evtNote,     setEvtNote]     = useState('');
  const [evtLocation, setEvtLocation] = useState('');
  const [evtStatus,   setEvtStatus]   = useState('');
  const [adminNote,   setAdminNote]   = useState('');
  const [copied,      setCopied]      = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [orderRes, timelineRes] = await Promise.allSettled([
        adminOrdersApi.getOne(id),
        adminTrackingApi.getTimeline(id),
      ]);
      if (orderRes.status === 'fulfilled' && orderRes.value.success) {
        const o = orderRes.value.data;
        setOrder(o);
        setNewStatus(o.status);
        setAdminNote(o.adminNote || '');
        if (o.trackingCode)      setTrkCode(o.trackingCode);
        if (o.carrierCode)       setCarrierCode(o.carrierCode);
        if (o.estimatedDelivery) setEstDelivery(o.estimatedDelivery.slice(0, 10));
      }
      if (timelineRes.status === 'fulfilled' && timelineRes.value.success)
        setTimeline(timelineRes.value.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // actions
  const handleStatusUpdate = async () => {
    if (!id || !newStatus) return;
    setSaving(true);
    try {
      await adminOrdersApi.updateStatus(id, newStatus as Order['status'], statusNote);
      dispatch(showAdminToast({ message: `Status updated to "${newStatus}"`, type: 'success' }));
      setStatusNote('');
      await load();
    } catch { dispatch(showAdminToast({ message: 'Failed to update status', type: 'error' })); }
    finally { setSaving(false); }
  };

  const handleAssignTracking = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await adminTrackingApi.assign(id, {
        trackingCode:      trkCode      || undefined,
        carrierCode:       carrierCode  || undefined,
        estimatedDelivery: estDelivery  ? new Date(estDelivery).toISOString() : undefined,
        note:              trkNote      || undefined,
      });
      dispatch(showAdminToast({ message: 'Tracking assigned & customer notified', type: 'success' }));
      setTrkNote('');
      await load();
    } catch { dispatch(showAdminToast({ message: 'Failed to assign tracking', type: 'error' })); }
    finally { setSaving(false); }
  };

  const handleAddEvent = async () => {
    if (!id || !evtNote) return;
    setSaving(true);
    try {
      await adminTrackingApi.addEvent(id, {
        status:   evtStatus   || order?.status || 'update',
        location: evtLocation || undefined,
        note:     evtNote,
      });
      dispatch(showAdminToast({ message: 'Tracking event added', type: 'success' }));
      setEvtNote(''); setEvtLocation(''); setEvtStatus('');
      await load();
    } catch { dispatch(showAdminToast({ message: 'Failed to add event', type: 'error' })); }
    finally { setSaving(false); }
  };

  const handleSaveAdminNote = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('adminAccessToken')}`,
        },
        body: JSON.stringify({ status: order!.status, adminNote }),
      });
      dispatch(showAdminToast({ message: 'Admin note saved', type: 'success' }));
    } catch { dispatch(showAdminToast({ message: 'Failed to save note', type: 'error' })); }
    finally { setSaving(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    });
  };

  // ── render ──────────────────────────────────────────────────────────────────
  if (loading) return <Page><Spinner /></Page>;
  if (!order)  return (
    <Page>
      <div style={{ textAlign: 'center', paddingTop: 80, color: t.colors.textMuted, fontSize: '0.9375rem' }}>
        Order not found.
      </div>
    </Page>
  );

  const cancelled  = order.status === 'cancelled';
  const activeStep = stepIndex(order.status);
  const tl         = timeline?.timeline || [];

  return (
    <Page>
      {/* Header */}
      <Header>
        <BackBtn onClick={() => navigate('/admin/orders')}>← Back to Orders</BackBtn>
        <TitleBlock>
          <PageTitle>Order Detail</PageTitle>
          <OrderMeta>{order.orderNumber || order.id}</OrderMeta>
        </TitleBlock>
        <HeaderRight>
          <StatusTag $s={order.status}>● {order.status}</StatusTag>
          <StatusTag $s={order.paymentStatus}>{order.paymentStatus}</StatusTag>
        </HeaderRight>
      </Header>

      {/* Pipeline / cancelled */}
      {cancelled ? (
        <CancelledBanner>
          <span style={{ fontSize: '1.1rem' }}>❌</span>
          This order has been cancelled.
        </CancelledBanner>
      ) : (
        <Section style={{ marginBottom: 20 }}>
          <SectionBody style={{ paddingBottom: 12 }}>
            <StepBar>
              {STEPS.map((s, i) => (
                <React.Fragment key={s.key}>
                  <StepItem $done={i < activeStep} $active={i === activeStep}>
                    <div className="step-icon"><s.icon size={18} strokeWidth={2} /></div>
                    <div className="step-label">{s.label}</div>
                  </StepItem>
                  {i < STEPS.length - 1 && <StepConnector $done={i < activeStep} />}
                </React.Fragment>
              ))}
            </StepBar>
          </SectionBody>
        </Section>
      )}

      <Grid>
        {/* Left column */}
        <Col>
          {/* Items */}
          <Section $stripe={t.colors.primary}>
            <SectionHead>
              <SectionHeadTitle>📦 Items Ordered</SectionHeadTitle>
              <span style={{ fontSize: '0.8125rem', color: t.colors.textMuted }}>
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </span>
            </SectionHead>
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th style={{ textAlign: 'right' }}>Price</Th>
                  <Th style={{ textAlign: 'center' }}>Qty</Th>
                  <Th style={{ textAlign: 'right' }}>Total</Th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {item.image && (
                          <ProductImg
                            src={item.image} alt={item.name}
                            onError={e => (e.currentTarget.style.display = 'none')}
                          />
                        )}
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                      </div>
                    </Td>
                    <Td style={{ textAlign: 'right', color: t.colors.textSecondary }}>
                      {fmtCurrency(item.price)}
                    </Td>
                    <Td style={{ textAlign: 'center' }}>
                      <span style={{
                        background: t.colors.surfaceAlt, border: `1px solid ${t.colors.border}`,
                        borderRadius: t.radii.sm, padding: '2px 10px',
                        fontSize: '0.8125rem', fontWeight: 600,
                      }}>
                        {item.quantity}
                      </span>
                    </Td>
                    <Td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {fmtCurrency(item.price * item.quantity)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <SummaryBlock>
              <SummaryRow><span>Subtotal</span><span>{fmtCurrency(order.subtotal)}</span></SummaryRow>
              <SummaryRow>
                <span>Shipping</span>
                <span>{order.shipping > 0
                  ? fmtCurrency(order.shipping)
                  : <span style={{ color: t.colors.success, fontWeight: 600 }}>Free</span>}
                </span>
              </SummaryRow>
              <SummaryRow $total>
                <span>Total</span>
                <TotalAmt>{fmtCurrency(order.subtotal)}</TotalAmt>
              </SummaryRow>
            </SummaryBlock>
          </Section>

          {/* Timeline */}
          <Section $stripe={t.colors.info}>
            <SectionHead>
              <SectionHeadTitle>🚚 Tracking Timeline</SectionHeadTitle>
              {timeline?.trackingCode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: t.fonts.mono, fontSize: '0.8125rem', fontWeight: 700, color: t.colors.primary, letterSpacing: '1.5px' }}>
                    {timeline.trackingCode}
                  </span>
                  <CopyBtn onClick={() => copyCode(timeline.trackingCode!)}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </CopyBtn>
                </div>
              )}
            </SectionHead>
            <SectionBody>
              {timeline?.carrierInfo?.trackingUrl && (
                <a href={timeline.carrierInfo.trackingUrl} target="_blank" rel="noopener noreferrer"
                   style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: t.colors.info,
                     fontSize: '0.875rem', textDecoration: 'none', fontWeight: 600, marginBottom: 16 }}>
                  🔗 Track with {timeline.carrierInfo.label} ↗
                </a>
              )}
              {timeline?.estimatedDelivery && (
                <DeliveryBanner>
                  📅 Est. Delivery:&nbsp;
                  <strong>
                    {new Date(timeline.estimatedDelivery).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </strong>
                </DeliveryBanner>
              )}
              {tl.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: t.colors.textMuted, fontSize: '0.875rem' }}>
                  No tracking events yet. Assign a tracking code or add events below.
                </div>
              ) : (
                <Timeline>
                  <TLLine />
                  {[...tl].reverse().map((ev, i) => {
                    const isLatest = i === 0;
                    const fg  = timelineColor(ev.status);
                    const sc  = STATUS_COLORS[ev.status];
                    return (
                      <TLItem key={ev.id || i}>
                        <TLDot $color={fg} $active={isLatest} />
                        <TLTitle>{ev.note || ev.status}</TLTitle>
                        {ev.location && <TLNote>📍 {ev.location}</TLNote>}
                        <TLMeta>
                          <span>{fmtDateShort(ev.timestamp)}</span>
                          <TLBadge $bg={sc?.bg} $fg={sc?.fg}>{ev.status}</TLBadge>
                          {ev.actor && ev.actor !== 'system' && <TLBadge>by {ev.actor}</TLBadge>}
                        </TLMeta>
                      </TLItem>
                    );
                  })}
                </Timeline>
              )}
            </SectionBody>
          </Section>
        </Col>

        {/* Right column */}
        <Col>
          {/* Order info */}
          <Section>
            <SectionHead>
              <SectionHeadTitle>ℹ️ Order Info</SectionHeadTitle>
              <span style={{ fontSize: '0.75rem', color: t.colors.textMuted }}>{fmtDate(order.createdAt)}</span>
            </SectionHead>
            <SectionBody>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>Customer</InfoLabel>
                  <InfoValue>{order.userName || '—'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue style={{ wordBreak: 'break-all', fontSize: '0.8125rem' }}>{order.userEmail || '—'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Payment Method</InfoLabel>
                  <InfoValue>{order.paymentMethodLabel || order.paymentMethod}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Payment Status</InfoLabel>
                  <InfoValue><StatusTag $s={order.paymentStatus}>{order.paymentStatus}</StatusTag></InfoValue>
                </InfoItem>
              </InfoGrid>
              {order.address && Object.keys(order.address).length > 0 && (
                <>
                  <AdminDivider />
                  <InfoLabel style={{ marginBottom: 8 }}>Shipping Address</InfoLabel>
                  <InfoValue style={{ lineHeight: 1.7, color: t.colors.textSecondary }}>
                    {[order.address.street, order.address.city, order.address.state, order.address.zip, order.address.country].filter(Boolean).join(', ')}
                  </InfoValue>
                </>
              )}
              {order.notes && (
                <>
                  <AdminDivider />
                  <InfoLabel style={{ marginBottom: 4 }}>Customer Notes</InfoLabel>
                  <InfoValue style={{ color: t.colors.textSecondary, fontStyle: 'italic', fontSize: '0.8125rem' }}>
                    {order.notes}
                  </InfoValue>
                </>
              )}
            </SectionBody>
          </Section>

          {/* Update status */}
          <Section $stripe={t.colors.warning}>
            <SectionHead><SectionHeadTitle>⚙️ Update Status</SectionHeadTitle></SectionHead>
            <SectionBody>
              <FormRow>
                <FormLabel>New Status</FormLabel>
                <AdminSelect value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </AdminSelect>
              </FormRow>
              <FormRow>
                <FormLabel>Internal Note <span style={{ color: t.colors.textMuted, fontWeight: 400 }}>(optional)</span></FormLabel>
                <AdminInput placeholder="e.g. Confirmed by warehouse team" value={statusNote} onChange={e => setStatusNote(e.target.value)} />
              </FormRow>
              <BtnRow>
                <AdminBtn $variant="primary" onClick={handleStatusUpdate} disabled={saving || newStatus === order.status}>
                  {saving ? '…' : 'Update Status'}
                </AdminBtn>
              </BtnRow>
            </SectionBody>
          </Section>

          {/* Assign tracking */}
          <Section $stripe={t.colors.info}>
            <SectionHead><SectionHeadTitle>📍 Assign Tracking</SectionHeadTitle></SectionHead>
            <SectionBody>
              {order.trackingCode && (
                <TrackingCodeBox>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6875rem', color: t.colors.textMuted, marginBottom: 3, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      Current Tracking Code
                    </div>
                    <TrackingCodeText>{order.trackingCode}</TrackingCodeText>
                  </div>
                  <CopyBtn onClick={() => copyCode(order.trackingCode!)}>{copied ? '✓' : '📋 Copy'}</CopyBtn>
                </TrackingCodeBox>
              )}
              <FormRow>
                <FormLabel>Internal Code <span style={{ color: t.colors.textMuted, fontWeight: 400 }}>(auto-generated if blank)</span></FormLabel>
                <AdminInput placeholder="VGF-XXXX-XXXXXX" value={trkCode} onChange={e => setTrkCode(e.target.value.toUpperCase())} />
              </FormRow>
              <FormRow>
                <FormLabel>Carrier Tracking # <span style={{ color: t.colors.textMuted, fontWeight: 400 }}>(UPS, FedEx, DHL…)</span></FormLabel>
                <AdminInput placeholder="1Z999AA10123456784" value={carrierCode} onChange={e => setCarrierCode(e.target.value)} />
                {carrierCode && <HintText>✓ Carrier auto-detected from number format</HintText>}
              </FormRow>
              <FormRow>
                <FormLabel>Estimated Delivery Date</FormLabel>
                <AdminInput type="date" value={estDelivery} onChange={e => setEstDelivery(e.target.value)} />
              </FormRow>
              <FormRow>
                <FormLabel>Note <span style={{ color: t.colors.textMuted, fontWeight: 400 }}>(sent to customer)</span></FormLabel>
                <AdminInput placeholder="Your order has been handed to the carrier" value={trkNote} onChange={e => setTrkNote(e.target.value)} />
              </FormRow>
              <BtnRow>
                <AdminBtn $variant="primary" onClick={handleAssignTracking} disabled={saving}>
                  {saving ? '…' : order.trackingCode ? '🔄 Update Tracking' : '🚀 Assign & Notify'}
                </AdminBtn>
              </BtnRow>
              <FootNote>✉️ Customer will receive an email with the tracking code when you click Assign.</FootNote>
            </SectionBody>
          </Section>

          {/* Add event */}
          <Section $stripe="#7c3aed">
            <SectionHead><SectionHeadTitle>➕ Add Tracking Event</SectionHeadTitle></SectionHead>
            <SectionBody>
              <FormRow>
                <FormLabel>Status Tag</FormLabel>
                <AdminSelect value={evtStatus} onChange={e => setEvtStatus(e.target.value)}>
                  <option value="">— same as order status —</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing / Packed</option>
                  <option value="shipped">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="update">General Update</option>
                </AdminSelect>
              </FormRow>
              <FormRow>
                <FormLabel>Location <span style={{ color: t.colors.textMuted, fontWeight: 400 }}>(optional)</span></FormLabel>
                <AdminInput placeholder="e.g. Warsaw Distribution Center" value={evtLocation} onChange={e => setEvtLocation(e.target.value)} />
              </FormRow>
              <FormRow>
                <FormLabel>Event Note *</FormLabel>
                <AdminTextarea placeholder="e.g. Package sorted and ready for courier pickup" value={evtNote} onChange={e => setEvtNote(e.target.value)} />
              </FormRow>
              <BtnRow>
                <AdminBtn $variant="primary" onClick={handleAddEvent} disabled={saving || !evtNote.trim()}>
                  {saving ? '…' : 'Add Event'}
                </AdminBtn>
              </BtnRow>
            </SectionBody>
          </Section>

          {/* Admin note */}
          <Section>
            <SectionHead><SectionHeadTitle>📝 Admin Note</SectionHeadTitle></SectionHead>
            <SectionBody>
              <FormRow>
                <FormLabel>Internal note — not visible to customer</FormLabel>
                <AdminTextarea placeholder="Add an internal note…" value={adminNote} onChange={e => setAdminNote(e.target.value)} style={{ minHeight: 80 }} />
              </FormRow>
              <BtnRow>
                <AdminBtn $variant="ghost" onClick={handleSaveAdminNote} disabled={saving}>Save Note</AdminBtn>
              </BtnRow>
            </SectionBody>
          </Section>
        </Col>
      </Grid>
    </Page>
  );
};

export default OrderDetailPage;