/**
 * src/admin/pages/InvoicePage.tsx
 * Route: /admin/orders/:id/invoice
 * Casual, clean invoice — no heavy design, just the info.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { adminOrdersApi, adminSettingsApi, Order, SiteSettings } from '../../api/admin';

const PrintStyles = createGlobalStyle`
  @media print {
    @page { margin: 15mm; size: A4; }
    body { background: #fff !important; }
    .no-print { display: none !important; }
  }
`;

const Page = styled.div`
  min-height: 100vh;
  background: #f7f8fa;
  padding: 28px 20px 60px;
  font-family: 'Outfit', 'Segoe UI', sans-serif;
  @media print { background: #fff; padding: 0; }
`;

const Toolbar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  max-width: 760px; margin: 0 auto 20px;
`;

const BackBtn = styled.button`
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-size: 0.875rem; color: #555; padding: 6px 0;
  font-family: inherit;
  &:hover { color: #111; }
`;

const BtnRow = styled.div`display: flex; gap: 8px;`;

const Btn = styled.button<{ $primary?: boolean }>`
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px; cursor: pointer;
  font-size: 0.85rem; font-weight: 500; font-family: inherit;
  border: 1px solid ${({ $primary }) => $primary ? '#465fff' : '#dde1e7'};
  background: ${({ $primary }) => $primary ? '#465fff' : '#fff'};
  color: ${({ $primary }) => $primary ? '#fff' : '#333'};
  &:hover { opacity: 0.88; }
`;

const Card = styled.div`
  max-width: 760px; margin: 0 auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  @media print { border: none; border-radius: 0; max-width: 100%; }
`;

const TopStrip = styled.div`
  background: #1e1e2e;
  padding: 28px 36px;
  display: flex; justify-content: space-between; align-items: flex-start;
  @media (max-width: 540px) { flex-direction: column; gap: 16px; padding: 22px 20px; }
`;

const StoreName = styled.div`
  font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 4px;
`;

const StoreInfo = styled.div`
  font-size: 0.78rem; color: #9ca3af; line-height: 1.7;
`;

const InvRight = styled.div`
  text-align: right;
  @media (max-width: 540px) { text-align: left; }
`;

const InvLabel = styled.div`
  font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase; color: #6b7280; margin-bottom: 2px;
`;

const InvNumber = styled.div`
  font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 8px;
`;

const StatusBadge = styled.span<{ $paid: boolean }>`
  display: inline-block;
  padding: 3px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
  background: ${({ $paid }) => $paid ? '#dcfce7' : '#fef9c3'};
  color: ${({ $paid }) => $paid ? '#16a34a' : '#854d0e'};
`;

const Body = styled.div`
  padding: 32px 36px;
  @media (max-width: 540px) { padding: 22px 20px; }
`;

const BillRow = styled.div`
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 24px; margin-bottom: 32px;
  @media (max-width: 600px) { grid-template-columns: 1fr; gap: 16px; }
`;

const BillBlock = styled.div``;

const BLabel = styled.div`
  font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 6px;
`;

const BName = styled.div`font-size: 0.9rem; font-weight: 600; color: #111; margin-bottom: 2px;`;
const BText = styled.div`font-size: 0.8rem; color: #6b7280; line-height: 1.6;`;

const Divider = styled.hr`border: none; border-top: 1px solid #f0f0f0; margin: 0 0 28px;`;

const SectionLabel = styled.div`
  font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 12px;
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; margin-bottom: 28px;
`;

const TH = styled.th<{ $right?: boolean; $center?: boolean }>`
  text-align: ${({ $right, $center }) => $right ? 'right' : $center ? 'center' : 'left'};
  font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.06em; color: #9ca3af;
  padding: 0 8px 10px;
  border-bottom: 1px solid #f0f0f0;
`;

const TR = styled.tr`
  border-bottom: 1px solid #f9fafb;
  &:last-child { border-bottom: none; }
`;

const TD = styled.td<{ $right?: boolean; $center?: boolean; $bold?: boolean }>`
  text-align: ${({ $right, $center }) => $right ? 'right' : $center ? 'center' : 'left'};
  font-size: 0.85rem;
  color: ${({ $bold }) => $bold ? '#111' : '#555'};
  font-weight: ${({ $bold }) => $bold ? 600 : 400};
  padding: 12px 8px;
`;

const ItemWrap = styled.div`display: flex; align-items: center; gap: 10px;`;

const ItemImg = styled.img`
  width: 32px; height: 32px; border-radius: 6px; object-fit: cover;
  border: 1px solid #f0f0f0; flex-shrink: 0;
`;

const ItemEmoji = styled.div`
  width: 32px; height: 32px; border-radius: 6px;
  background: #f3f4f6; display: flex; align-items: center;
  justify-content: center; font-size: 16px; flex-shrink: 0;
`;

const SumWrap = styled.div`
  display: flex; justify-content: flex-end; margin-bottom: 28px;
`;

const SumBox = styled.div`min-width: 260px;`;

const SumLine = styled.div<{ $total?: boolean }>`
  display: flex; justify-content: space-between;
  padding: ${({ $total }) => $total ? '14px 0 0' : '6px 0'};
  ${({ $total }) => $total && 'border-top: 1px solid #e5e7eb; margin-top: 8px;'}
`;

const SumKey = styled.span<{ $total?: boolean }>`
  font-size: ${({ $total }) => $total ? '0.9rem' : '0.83rem'};
  font-weight: ${({ $total }) => $total ? 700 : 400};
  color: ${({ $total }) => $total ? '#111' : '#6b7280'};
`;

const SumVal = styled.span<{ $total?: boolean }>`
  font-size: ${({ $total }) => $total ? '1rem' : '0.83rem'};
  font-weight: ${({ $total }) => $total ? 700 : 500};
  color: ${({ $total }) => $total ? '#111' : '#333'};
`;

const PMTag = styled.span`
  font-size: 0.78rem; font-weight: 500; color: #6b7280;
`;

const FootNote = styled.div`
  font-size: 0.8rem; color: #9ca3af; text-align: center;
  padding-top: 20px; border-top: 1px solid #f0f0f0;
  line-height: 1.6;
`;

const Center = styled.div`
  display: flex; align-items: center; justify-content: center;
  min-height: 300px; color: #9ca3af; font-size: 0.9rem;
`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });

const addDays = (iso: string, n: number) => {
  const d = new Date(iso); d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
};

const PM_LABELS: Record<string, string> = {
  card: '💳 Card', apple_pay: '🍎 Apple Pay', google_pay: '🔵 Google Pay',
  paypal: '🅿️ PayPal', klarna: '🟣 Klarna', revolut: '🔷 Revolut',
  sepa_debit: '🏦 SEPA Debit', ideal: '🇳🇱 iDEAL', bancontact: '🇧🇪 Bancontact',
  sofort: '⚡ SOFORT', giropay: '🇩🇪 Giropay', eps: '🇦🇹 EPS',
  przelewy24: '🇵🇱 Przelewy24', blik: '📱 BLIK', cod: '💵 Cash on Delivery',
  bank: '🏦 Bank Transfer',
};

const EMOJI = ['🥭', '🥤', '🥗', '🫐', '🥝', '🍊', '🥕', '🌿'];

export const InvoicePage: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order,    setOrder]    = useState<Order | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([adminOrdersApi.getOne(id), adminSettingsApi.get()])
      .then(([o, s]) => { setOrder(o.data); setSettings(s.data); })
      .catch(e => setErr(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Page><Center>Loading…</Center></Page>;
  if (err || !order) return <Page><Center>{err || 'Order not found'}</Center></Page>;

  const storeName    = settings?.siteName || 'Vegefoods';
  const storeAddress = settings?.address  || '210 Fake St. Mountain View, San Francisco, CA, USA';
  const storeEmail   = settings?.email    || '';
  const storePhone   = settings?.phone    || '';
  const addr         = order.address || {};
  const customerAddr = [addr.address || addr.line1, addr.city, addr.state,
    addr.zip || addr.postal_code, addr.country].filter(Boolean).join(', ') || '—';

  const subtotal = order.subtotal ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping  = order.shipping ?? 0;
  const vat       = Math.round(subtotal * 0.1 * 100) / 100;
  const total     = order.total ?? subtotal + vat + shipping;
  const invNum    = order.orderNumber || order.id?.slice(0, 8).toUpperCase();
  const isPaid    = order.paymentStatus === 'paid';

  return (
    <>
      <PrintStyles />
      <Page>
        <Toolbar className="no-print">
          <BackBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Back to Orders
          </BackBtn>
          <BtnRow>
            <Btn onClick={() => window.print()}>
              <Download size={14} /> Save PDF
            </Btn>
            <Btn $primary onClick={() => window.print()}>
              <Printer size={14} /> Print
            </Btn>
          </BtnRow>
        </Toolbar>

        <Card>
          <TopStrip>
            <div>
              <StoreName>{storeName}</StoreName>
              <StoreInfo>
                {storeAddress}
                {storeEmail && <><br />{storeEmail}</>}
                {storePhone && <><br />{storePhone}</>}
              </StoreInfo>
            </div>
            <InvRight>
              <InvLabel>Invoice</InvLabel>
              <InvNumber>#{invNum}</InvNumber>
              <StatusBadge $paid={isPaid}>
                {order.paymentStatus || 'pending'}
              </StatusBadge>
            </InvRight>
          </TopStrip>

          <Body>
            <BillRow>
              <BillBlock>
                <BLabel>From</BLabel>
                <BName>{storeName}</BName>
                <BText>{storeAddress}</BText>
              </BillBlock>
              <BillBlock>
                <BLabel>To</BLabel>
                <BName>{order.userName || '—'}</BName>
                <BText>
                  {order.userEmail && <>{order.userEmail}<br /></>}
                  {customerAddr}
                </BText>
              </BillBlock>
              <BillBlock>
                <BLabel>Issued</BLabel>
                <BText style={{ marginBottom: 10 }}>{fmtDate(order.createdAt)}</BText>
                <BLabel>Due</BLabel>
                <BText>{addDays(order.createdAt, 5)}</BText>
              </BillBlock>
            </BillRow>

            <Divider />

            <SectionLabel>Items</SectionLabel>
            <Table>
              <thead>
                <tr>
                  <TH style={{ width: 40 }}>#</TH>
                  <TH>Product</TH>
                  <TH $center style={{ width: 70 }}>Qty</TH>
                  <TH $right style={{ width: 100 }}>Price</TH>
                  <TH $right style={{ width: 100 }}>Total</TH>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <TR key={i}>
                    <TD style={{ color: '#bbb', fontSize: '0.8rem' }}>{i + 1}</TD>
                    <TD>
                      <ItemWrap>
                        {item.image
                          ? <ItemImg src={item.image} alt={item.name}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <ItemEmoji>{EMOJI[i % EMOJI.length]}</ItemEmoji>
                        }
                        {item.name}
                      </ItemWrap>
                    </TD>
                    <TD $center>{item.quantity}</TD>
                    <TD $right>${item.price.toFixed(2)}</TD>
                    <TD $right $bold>${(item.price * item.quantity).toFixed(2)}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>

            <SumWrap>
              <SumBox>
                <SumLine>
                  <SumKey>Subtotal</SumKey>
                  <SumVal>${subtotal.toFixed(2)}</SumVal>
                </SumLine>
                {vat > 0 && (
                  <SumLine>
                    <SumKey>VAT (10%)</SumKey>
                    <SumVal>${vat.toFixed(2)}</SumVal>
                  </SumLine>
                )}
                {shipping > 0 && (
                  <SumLine>
                    <SumKey>Shipping</SumKey>
                    <SumVal>${shipping.toFixed(2)}</SumVal>
                  </SumLine>
                )}
                {order.paymentMethod && (
                  <SumLine>
                    <SumKey>Payment</SumKey>
                    <PMTag>{PM_LABELS[order.paymentMethod] || order.paymentMethod}</PMTag>
                  </SumLine>
                )}
                <SumLine $total>
                  <SumKey $total>Total</SumKey>
                  <SumVal $total>${total.toFixed(2)}</SumVal>
                </SumLine>
              </SumBox>
            </SumWrap>

            <FootNote>
              Thanks for your order! Questions? Reach us{storeEmail ? ` at ${storeEmail}` : ''}.
              <br />Payment due by <strong>{addDays(order.createdAt, 5)}</strong>.
            </FootNote>
          </Body>
        </Card>
      </Page>
    </>
  );
};

export default InvoicePage;