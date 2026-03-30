/**
 * src/admin/pages/OrderDetailPage.tsx
 *
 * Full order detail view with:
 *  - Order summary (items, totals, payment, address)
 *  - Status management with note
 *  - Tracking assignment (internal VGF code or external carrier code)
 *  - Live tracking timeline
 *  - Manual event injection
 *  - Admin note
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useDispatch } from 'react-redux';
import {
  adminOrdersApi,
  adminTrackingApi,
  Order,
  TrackingTimeline,
} from '../../api/admin';
import { showAdminToast } from '../store';

// ── Animations ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}`;
const spin    = keyframes`to{transform:rotate(360deg)}`;
const pulse   = keyframes`0%,100%{opacity:1}50%{opacity:.4}`;

// ── Theme helpers ─────────────────────────────────────────────────────────────
const t = {
  bg:        'var(--color-bg-primary,#0f1117)',
  card:      'var(--color-bg-secondary,#1a1d27)',
  border:    'var(--color-border,rgba(255,255,255,.08))',
  text:      'var(--color-text-primary,#f1f5f9)',
  muted:     'var(--color-text-secondary,#94a3b8)',
  accent:    '#82ae46',
  accentBg:  'rgba(130,174,70,.12)',
  danger:    '#ef4444',
  warning:   '#f59e0b',
  info:      '#3b82f6',
  purple:    '#8b5cf6',
  cyan:      '#06b6d4',
  green:     '#10b981',
};

// ── Styled components ─────────────────────────────────────────────────────────
const Page    = styled.div`min-height:100vh;background:${t.bg};padding:24px;animation:${fadeIn} .3s ease;`;
const Header  = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:28px;flex-wrap:wrap;`;
const BackBtn = styled.button`
  display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;
  border:1px solid ${t.border};background:${t.card};color:${t.muted};
  cursor:pointer;font-size:13px;transition:all .2s;
  &:hover{color:${t.text};border-color:${t.accent};}
`;
const Title   = styled.h1`font-size:1.375rem;font-weight:700;color:${t.text};margin:0;`;
const OrderNum = styled.span`font-size:.9rem;color:${t.muted};font-weight:500;`;

const Grid = styled.div`
  display:grid;
  grid-template-columns:1fr 380px;
  gap:20px;
  @media(max-width:1024px){grid-template-columns:1fr;}
`;
const Col = styled.div`display:flex;flex-direction:column;gap:20px;`;

const Card = styled.div<{$accent?:string}>`
  background:${t.card};border-radius:12px;border:1px solid ${t.border};
  overflow:hidden;
  ${p=>p.$accent?`border-top:3px solid ${p.$accent};`:''}
`;
const CardHead = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 20px;border-bottom:1px solid ${t.border};
`;
const CardTitle = styled.h3`font-size:.9375rem;font-weight:600;color:${t.text};margin:0;display:flex;align-items:center;gap:8px;`;
const CardBody  = styled.div`padding:20px;`;

// Status badge
const STATUS_COLORS: Record<string,string> = {
  pending:'#f59e0b', confirmed:'#3b82f6', processing:'#8b5cf6',
  shipped:'#06b6d4', delivered:'#10b981', cancelled:'#ef4444',
  paid:'#10b981', refunded:'#f59e0b', failed:'#ef4444',
};
const StatusBadge = styled.span<{$s:string}>`
  display:inline-flex;align-items:center;gap:5px;
  padding:4px 10px;border-radius:20px;font-size:.75rem;font-weight:600;letter-spacing:.3px;
  background:${p=>STATUS_COLORS[p.$s]||'#64748b'}22;
  color:${p=>STATUS_COLORS[p.$s]||'#64748b'};
  border:1px solid ${p=>STATUS_COLORS[p.$s]||'#64748b'}44;
`;

// Form elements
const Label   = styled.label`display:block;font-size:.8125rem;font-weight:600;color:${t.muted};margin-bottom:6px;`;
const Input   = styled.input`
  width:100%;box-sizing:border-box;background:${t.bg};border:1px solid ${t.border};
  border-radius:8px;padding:9px 12px;color:${t.text};font-size:.875rem;outline:none;
  transition:border .2s;
  &:focus{border-color:${t.accent};}
  &::placeholder{color:${t.muted};}
`;
const Select  = styled.select`
  width:100%;box-sizing:border-box;background:${t.bg};border:1px solid ${t.border};
  border-radius:8px;padding:9px 12px;color:${t.text};font-size:.875rem;outline:none;
  transition:border .2s;cursor:pointer;
  &:focus{border-color:${t.accent};}
`;
const Textarea = styled.textarea`
  width:100%;box-sizing:border-box;background:${t.bg};border:1px solid ${t.border};
  border-radius:8px;padding:9px 12px;color:${t.text};font-size:.875rem;outline:none;
  resize:vertical;min-height:72px;font-family:inherit;
  transition:border .2s;
  &:focus{border-color:${t.accent};}
  &::placeholder{color:${t.muted};}
`;
const FormRow = styled.div`display:flex;flex-direction:column;gap:6px;margin-bottom:14px;`;
const BtnRow  = styled.div`display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;`;

const Btn = styled.button<{$variant?:'primary'|'danger'|'ghost'}>`
  display:inline-flex;align-items:center;gap:6px;padding:9px 18px;
  border-radius:8px;font-size:.875rem;font-weight:600;cursor:pointer;transition:all .2s;border:1px solid;
  ${p=>p.$variant==='primary'?`background:${t.accent};color:#fff;border-color:${t.accent};&:hover{filter:brightness(1.1);}`:''}
  ${p=>p.$variant==='danger'?`background:transparent;color:${t.danger};border-color:${t.danger}33;&:hover{background:${t.danger}22;}`:''}
  ${p=>(!p.$variant||p.$variant==='ghost')?`background:transparent;color:${t.muted};border-color:${t.border};&:hover{color:${t.text};border-color:${t.accent}44;}`:''}
  &:disabled{opacity:.45;cursor:not-allowed;}
`;

// Items table
const Table = styled.table`width:100%;border-collapse:collapse;`;
const Th    = styled.th`text-align:left;padding:8px 12px;font-size:.75rem;font-weight:700;color:${t.muted};text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid ${t.border};`;
const Td    = styled.td`padding:10px 12px;font-size:.875rem;color:${t.text};border-bottom:1px solid ${t.border};vertical-align:middle;`;
const ProductImg = styled.img`width:40px;height:40px;border-radius:6px;object-fit:cover;border:1px solid ${t.border};`;

// Summary rows
const SummaryRow = styled.div<{$total?:boolean}>`
  display:flex;justify-content:space-between;align-items:center;
  padding:6px 0;font-size:${p=>p.$total?'.9375rem':'.875rem'};
  font-weight:${p=>p.$total?'700':'400'};
  color:${p=>p.$total?t.text:t.muted};
  ${p=>p.$total?`border-top:1px solid ${t.border};padding-top:12px;margin-top:4px;`:''}
`;

// Tracking timeline
const Timeline = styled.div`position:relative;padding-left:24px;`;
const TLLine   = styled.div`
  position:absolute;left:7px;top:0;bottom:0;width:2px;
  background:linear-gradient(to bottom,${t.accent}88 0%,${t.border} 80%);
  border-radius:1px;
`;
const TLItem   = styled.div<{$active?:boolean}>`
  position:relative;margin-bottom:20px;
  &:last-child{margin-bottom:0;}
`;
const TLDot    = styled.div<{$color?:string;$active?:boolean}>`
  position:absolute;left:-20px;top:2px;
  width:14px;height:14px;border-radius:50%;
  background:${p=>p.$color||t.accent};
  border:2px solid ${t.card};
  box-shadow:0 0 0 2px ${p=>p.$color||t.accent}44;
  ${p=>p.$active?`animation:${pulse} 2s ease infinite;`:''}
`;
const TLContent = styled.div``;
const TLTitle   = styled.div`font-size:.875rem;font-weight:600;color:${t.text};`;
const TLNote    = styled.div`font-size:.8125rem;color:${t.muted};margin-top:2px;`;
const TLMeta    = styled.div`font-size:.75rem;color:${t.muted};margin-top:4px;display:flex;gap:8px;flex-wrap:wrap;`;
const TLBadge   = styled.span<{$c?:string}>`
  background:${p=>p.$c||t.accentBg};color:${p=>p.$c?'#fff':t.accent};
  padding:1px 8px;border-radius:20px;font-size:.7rem;font-weight:600;
`;

// Info grid
const InfoGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:12px;`;
const InfoItem = styled.div``;
const InfoLabel = styled.div`font-size:.75rem;color:${t.muted};font-weight:600;margin-bottom:3px;text-transform:uppercase;letter-spacing:.4px;`;
const InfoValue = styled.div`font-size:.875rem;color:${t.text};`;

// Spinner
const Spinner = styled.div`
  width:32px;height:32px;border:3px solid ${t.border};border-top-color:${t.accent};
  border-radius:50%;animation:${spin} .75s linear infinite;margin:40px auto;
`;

// Section divider
const Divider = styled.div`height:1px;background:${t.border};margin:16px 0;`;

// Tracking code display
const TrackingCode = styled.div`
  display:flex;align-items:center;gap:10px;
  background:${t.accentBg};border:1px solid ${t.accent}44;
  border-radius:8px;padding:12px 16px;margin-bottom:16px;
`;
const TrackingCodeText = styled.span`
  font-family:monospace;font-size:1.0625rem;font-weight:700;
  color:${t.accent};letter-spacing:2px;flex:1;
`;
const CopyBtn = styled.button`
  background:transparent;border:none;color:${t.muted};cursor:pointer;
  font-size:.75rem;padding:4px 8px;border-radius:4px;transition:all .2s;
  &:hover{color:${t.text};background:${t.border};}
`;

// ── Status/steps tracker (visual pipeline) ────────────────────────────────────
const STEPS = [
  { key:'pending',    icon:'📋', label:'Placed'    },
  { key:'confirmed',  icon:'✅', label:'Confirmed' },
  { key:'processing', icon:'📦', label:'Packing'   },
  { key:'shipped',    icon:'🚚', label:'Shipped'   },
  { key:'delivered',  icon:'🎉', label:'Delivered' },
];
const StepBar = styled.div`display:flex;align-items:center;gap:0;margin-bottom:20px;overflow-x:auto;padding-bottom:4px;`;
const Step    = styled.div<{$done?:boolean;$active?:boolean;$cancelled?:boolean}>`
  display:flex;flex-direction:column;align-items:center;gap:4px;min-width:72px;
  .icon{
    width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:1rem;border:2px solid;transition:all .3s;
    border-color:${p=>p.$cancelled?t.danger:p.$done||p.$active?t.accent:t.border};
    background:${p=>p.$cancelled?t.danger+'22':p.$done||p.$active?t.accentBg:'transparent'};
  }
  .lbl{font-size:.7rem;color:${p=>p.$cancelled?t.danger:p.$done||p.$active?t.accent:t.muted};font-weight:600;white-space:nowrap;}
`;
const StepLine = styled.div<{$done?:boolean}>`
  flex:1;height:2px;min-width:20px;
  background:${p=>p.$done?t.accent:t.border};
  margin-bottom:20px;transition:background .3s;
`;

// ── Helper functions ──────────────────────────────────────────────────────────
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(v || 0);

const fmtDate = (s?: string) => {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-US', {
    month:'short', day:'numeric', year:'numeric',
    hour:'2-digit', minute:'2-digit',
  });
};

const fmtDateShort = (s?: string) => {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
};

const timelineColor = (status: string) =>
  STATUS_COLORS[status] || '#64748b';

const stepIndex = (status: string) =>
  STEPS.findIndex(s => s.key === status);

// ── Component ─────────────────────────────────────────────────────────────────
export const OrderDetailPage: React.FC = () => {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const dispatch   = useDispatch();

  const [order,    setOrder]    = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TrackingTimeline | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // Status update form
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Tracking assign form
  const [trkCode,    setTrkCode]    = useState('');
  const [carrierCode, setCarrierCode] = useState('');
  const [estDelivery, setEstDelivery] = useState('');
  const [trkNote,    setTrkNote]    = useState('');

  // Manual event form
  const [evtNote,     setEvtNote]     = useState('');
  const [evtLocation, setEvtLocation] = useState('');
  const [evtStatus,   setEvtStatus]   = useState('');

  // Admin note form
  const [adminNote, setAdminNote] = useState('');

  // Copied state
  const [copied, setCopied] = useState(false);

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
        if (o.trackingCode) setTrkCode(o.trackingCode);
        if (o.carrierCode)  setCarrierCode(o.carrierCode);
        if (o.estimatedDelivery) setEstDelivery(o.estimatedDelivery.slice(0, 10));
      }
      if (timelineRes.status === 'fulfilled' && timelineRes.value.success) {
        setTimeline(timelineRes.value.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    if (!id || !newStatus) return;
    setSaving(true);
    try {
      await adminOrdersApi.updateStatus(id, newStatus as Order['status'], statusNote);
      dispatch(showAdminToast({ message: `Status updated to "${newStatus}"`, type: 'success' }));
      setStatusNote('');
      await load();
    } catch {
      dispatch(showAdminToast({ message: 'Failed to update status', type: 'error' }));
    } finally { setSaving(false); }
  };

  const handleAssignTracking = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await adminTrackingApi.assign(id, {
        trackingCode:      trkCode      || undefined,
        carrierCode:       carrierCode   || undefined,
        estimatedDelivery: estDelivery   ? new Date(estDelivery).toISOString() : undefined,
        note:              trkNote       || undefined,
      });
      dispatch(showAdminToast({ message: 'Tracking assigned & customer notified', type: 'success' }));
      setTrkNote('');
      await load();
    } catch {
      dispatch(showAdminToast({ message: 'Failed to assign tracking', type: 'error' }));
    } finally { setSaving(false); }
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
    } catch {
      dispatch(showAdminToast({ message: 'Failed to add event', type: 'error' }));
    } finally { setSaving(false); }
  };

  const handleSaveAdminNote = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // Update via status endpoint with same status (to preserve it) but set adminNote
      await adminOrdersApi.updateStatus(id, order!.status, undefined);
      // Patch adminNote directly
      // (backend updateOrderStatus accepts adminNote field)
      await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('adminAccessToken')}` },
        body: JSON.stringify({ status: order!.status, adminNote }),
      });
      dispatch(showAdminToast({ message: 'Admin note saved', type: 'success' }));
    } catch {
      dispatch(showAdminToast({ message: 'Failed to save note', type: 'error' }));
    } finally { setSaving(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <Page><Spinner /></Page>;
  if (!order)  return <Page><div style={{color:t.muted,textAlign:'center',paddingTop:60}}>Order not found.</div></Page>;

  const cancelled   = order.status === 'cancelled';
  const activeStep  = stepIndex(order.status);
  const tl          = timeline?.timeline || [];

  return (
    <Page>
      <Header>
        <BackBtn onClick={() => navigate('/admin/orders')}>← Back</BackBtn>
        <div>
          <Title>Order Detail</Title>
          <OrderNum>{order.orderNumber || order.id}</OrderNum>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center' }}>
          <StatusBadge $s={order.status}>● {order.status}</StatusBadge>
          <StatusBadge $s={order.paymentStatus}>{order.paymentStatus}</StatusBadge>
        </div>
      </Header>

      {/* ── Progress bar ── */}
      {!cancelled && (
        <Card style={{ marginBottom:20 }}>
          <CardBody style={{ paddingBottom:8 }}>
            <StepBar>
              {STEPS.map((s, i) => (
                <React.Fragment key={s.key}>
                  <Step $done={i < activeStep} $active={i === activeStep}>
                    <div className="icon">{s.icon}</div>
                    <div className="lbl">{s.label}</div>
                  </Step>
                  {i < STEPS.length - 1 && <StepLine $done={i < activeStep} />}
                </React.Fragment>
              ))}
            </StepBar>
          </CardBody>
        </Card>
      )}
      {cancelled && (
        <div style={{ background:`${t.danger}11`, border:`1px solid ${t.danger}33`, borderRadius:10, padding:'10px 18px', marginBottom:20, color:t.danger, fontWeight:600, fontSize:'.875rem' }}>
          ❌ This order has been cancelled.
        </div>
      )}

      <Grid>
        {/* ── Left column ── */}
        <Col>
          {/* Items */}
          <Card $accent={t.accent}>
            <CardHead>
              <CardTitle>📦 Items Ordered</CardTitle>
              <span style={{fontSize:'.8125rem',color:t.muted}}>{order.items.length} item{order.items.length!==1?'s':''}</span>
            </CardHead>
            <CardBody style={{ padding:0 }}>
              <Table>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th style={{textAlign:'right'}}>Price</Th>
                    <Th style={{textAlign:'center'}}>Qty</Th>
                    <Th style={{textAlign:'right'}}>Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <Td>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          {item.image && <ProductImg src={item.image} alt={item.name} onError={e=>(e.currentTarget.style.display='none')} />}
                          <span>{item.name}</span>
                        </div>
                      </Td>
                      <Td style={{textAlign:'right'}}>{fmtCurrency(item.price)}</Td>
                      <Td style={{textAlign:'center'}}>{item.quantity}</Td>
                      <Td style={{textAlign:'right',fontWeight:600}}>{fmtCurrency(item.price * item.quantity)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div style={{padding:'16px 20px'}}>
                <SummaryRow><span>Subtotal</span><span>{fmtCurrency(order.subtotal)}</span></SummaryRow>
                <SummaryRow><span>Shipping</span><span>{order.shipping > 0 ? fmtCurrency(order.shipping) : 'Free'}</span></SummaryRow>
                {order.tax != null && <SummaryRow><span>Tax (8%)</span><span>{fmtCurrency(order.tax)}</span></SummaryRow>}
                <SummaryRow $total><span>Total</span><span style={{color:t.accent}}>{fmtCurrency(order.total)}</span></SummaryRow>
              </div>
            </CardBody>
          </Card>

          {/* Tracking timeline */}
          <Card $accent={t.cyan}>
            <CardHead>
              <CardTitle>🚚 Tracking Timeline</CardTitle>
              {timeline?.trackingCode && (
                <TrackingCode style={{margin:0,padding:'6px 12px'}}>
                  <TrackingCodeText style={{fontSize:'.8125rem'}}>{timeline.trackingCode}</TrackingCodeText>
                  <CopyBtn onClick={() => copyCode(timeline.trackingCode!)}>{copied ? '✓ Copied' : 'Copy'}</CopyBtn>
                </TrackingCode>
              )}
            </CardHead>
            <CardBody>
              {timeline?.carrierInfo && timeline.carrierInfo.trackingUrl && (
                <div style={{marginBottom:16}}>
                  <a href={timeline.carrierInfo.trackingUrl} target="_blank" rel="noopener noreferrer"
                     style={{display:'inline-flex',alignItems:'center',gap:6,color:t.cyan,fontSize:'.875rem',textDecoration:'none',fontWeight:600}}>
                    🔗 Track with {timeline.carrierInfo.label} ↗
                  </a>
                </div>
              )}
              {timeline?.estimatedDelivery && (
                <div style={{background:`${t.green}11`,border:`1px solid ${t.green}33`,borderRadius:8,padding:'8px 14px',marginBottom:16,fontSize:'.8125rem',color:t.green}}>
                  📅 Est. Delivery: <strong>{new Date(timeline.estimatedDelivery).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</strong>
                </div>
              )}
              {tl.length === 0 ? (
                <div style={{textAlign:'center',padding:'24px 0',color:t.muted,fontSize:'.875rem'}}>
                  No tracking events yet. Assign a tracking code or add events below.
                </div>
              ) : (
                <Timeline>
                  <TLLine />
                  {[...tl].reverse().map((ev, i) => {
                    const isLatest = i === 0;
                    const color    = timelineColor(ev.status);
                    return (
                      <TLItem key={ev.id || i}>
                        <TLDot $color={color} $active={isLatest} />
                        <TLContent>
                          <TLTitle>{ev.note || ev.status}</TLTitle>
                          {ev.location && <TLNote>📍 {ev.location}</TLNote>}
                          <TLMeta>
                            <span>{fmtDateShort(ev.timestamp)}</span>
                            <TLBadge $c={color+'22'} style={{color}}>{ev.status}</TLBadge>
                            {ev.actor && ev.actor !== 'system' && <TLBadge>by {ev.actor}</TLBadge>}
                          </TLMeta>
                        </TLContent>
                      </TLItem>
                    );
                  })}
                </Timeline>
              )}
            </CardBody>
          </Card>
        </Col>

        {/* ── Right column ── */}
        <Col>
          {/* Order info */}
          <Card>
            <CardHead><CardTitle>ℹ️ Order Info</CardTitle><span style={{fontSize:'.75rem',color:t.muted}}>{fmtDate(order.createdAt)}</span></CardHead>
            <CardBody>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>Customer</InfoLabel>
                  <InfoValue>{order.userName || '—'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue style={{wordBreak:'break-all'}}>{order.userEmail || '—'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Payment</InfoLabel>
                  <InfoValue>{order.paymentMethodLabel || order.paymentMethod}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Payment Status</InfoLabel>
                  <InfoValue><StatusBadge $s={order.paymentStatus}>{order.paymentStatus}</StatusBadge></InfoValue>
                </InfoItem>
              </InfoGrid>
              {order.address && Object.keys(order.address).length > 0 && (
                <>
                  <Divider />
                  <InfoLabel style={{marginBottom:8}}>Shipping Address</InfoLabel>
                  <InfoValue style={{lineHeight:1.6}}>
                    {[order.address.street, order.address.city, order.address.state, order.address.zip, order.address.country].filter(Boolean).join(', ')}
                  </InfoValue>
                </>
              )}
              {order.notes && (
                <>
                  <Divider />
                  <InfoLabel style={{marginBottom:4}}>Customer Notes</InfoLabel>
                  <InfoValue style={{color:t.muted,fontStyle:'italic'}}>{order.notes}</InfoValue>
                </>
              )}
            </CardBody>
          </Card>

          {/* Update status */}
          <Card $accent={t.warning}>
            <CardHead><CardTitle>⚙️ Update Status</CardTitle></CardHead>
            <CardBody>
              <FormRow>
                <Label>New Status</Label>
                <Select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </FormRow>
              <FormRow>
                <Label>Internal Note (optional)</Label>
                <Input placeholder="e.g. Confirmed by warehouse team" value={statusNote} onChange={e => setStatusNote(e.target.value)} />
              </FormRow>
              <BtnRow>
                <Btn $variant="primary" onClick={handleStatusUpdate} disabled={saving || newStatus === order.status}>
                  {saving ? '…' : 'Update Status'}
                </Btn>
              </BtnRow>
            </CardBody>
          </Card>

          {/* Assign tracking */}
          <Card $accent={t.cyan}>
            <CardHead><CardTitle>📍 Assign Tracking</CardTitle></CardHead>
            <CardBody>
              {order.trackingCode && (
                <TrackingCode>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'.7rem',color:t.muted,marginBottom:3}}>CURRENT TRACKING CODE</div>
                    <TrackingCodeText>{order.trackingCode}</TrackingCodeText>
                  </div>
                  <CopyBtn onClick={() => copyCode(order.trackingCode!)}>{copied ? '✓' : '📋'}</CopyBtn>
                </TrackingCode>
              )}
              <FormRow>
                <Label>Internal Code (auto-generated if blank)</Label>
                <Input placeholder="VGF-XXXX-XXXXXX" value={trkCode} onChange={e => setTrkCode(e.target.value.toUpperCase())} />
              </FormRow>
              <FormRow>
                <Label>Carrier Tracking # (UPS, FedEx, DHL…)</Label>
                <Input placeholder="1Z999AA10123456784" value={carrierCode} onChange={e => setCarrierCode(e.target.value)} />
                {carrierCode && (
                  <div style={{fontSize:'.75rem',color:t.accent,marginTop:4}}>
                    ✓ Carrier auto-detected from number format
                  </div>
                )}
              </FormRow>
              <FormRow>
                <Label>Estimated Delivery Date</Label>
                <Input type="date" value={estDelivery} onChange={e => setEstDelivery(e.target.value)} />
              </FormRow>
              <FormRow>
                <Label>Note (sent to customer email)</Label>
                <Input placeholder="Your order has been handed to the carrier" value={trkNote} onChange={e => setTrkNote(e.target.value)} />
              </FormRow>
              <BtnRow>
                <Btn $variant="primary" onClick={handleAssignTracking} disabled={saving}>
                  {saving ? '…' : order.trackingCode ? '🔄 Update Tracking' : '🚀 Assign & Notify'}
                </Btn>
              </BtnRow>
              <div style={{fontSize:'.75rem',color:t.muted,marginTop:10}}>
                ✉️ Customer will receive an email with the tracking code when you click Assign.
              </div>
            </CardBody>
          </Card>

          {/* Add manual event */}
          <Card $accent={t.purple}>
            <CardHead><CardTitle>➕ Add Tracking Event</CardTitle></CardHead>
            <CardBody>
              <FormRow>
                <Label>Status Tag</Label>
                <Select value={evtStatus} onChange={e => setEvtStatus(e.target.value)}>
                  <option value="">— same as order status —</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing / Packed</option>
                  <option value="shipped">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="update">General Update</option>
                </Select>
              </FormRow>
              <FormRow>
                <Label>Location (optional)</Label>
                <Input placeholder="e.g. Warsaw Distribution Center" value={evtLocation} onChange={e => setEvtLocation(e.target.value)} />
              </FormRow>
              <FormRow>
                <Label>Event Note *</Label>
                <Textarea placeholder="e.g. Package sorted and ready for courier pickup" value={evtNote} onChange={e => setEvtNote(e.target.value)} />
              </FormRow>
              <BtnRow>
                <Btn $variant="primary" onClick={handleAddEvent} disabled={saving || !evtNote.trim()}>
                  {saving ? '…' : 'Add Event'}
                </Btn>
              </BtnRow>
            </CardBody>
          </Card>

          {/* Admin note */}
          <Card>
            <CardHead><CardTitle>📝 Admin Note</CardTitle></CardHead>
            <CardBody>
              <FormRow>
                <Textarea
                  placeholder="Internal note — not visible to customer"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  style={{ minHeight:80 }}
                />
              </FormRow>
              <BtnRow>
                <Btn $variant="ghost" onClick={handleSaveAdminNote} disabled={saving}>Save Note</Btn>
              </BtnRow>
            </CardBody>
          </Card>
        </Col>
      </Grid>
    </Page>
  );
};

export default OrderDetailPage;