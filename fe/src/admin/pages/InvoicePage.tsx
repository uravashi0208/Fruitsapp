/**
 * src/admin/pages/InvoicePage.tsx
 * Route: /admin/orders/:id/invoice
 * Clean invoice matching the Pimjo-style layout (image 2).
 * Print: @page margin:0 removes browser header/footer (URL, date, page number).
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { adminOrdersApi, adminSettingsApi, Order, SiteSettings } from '../../api/admin';

/* ── @page margin:0 kills the browser-native header/footer in print ─────────
   (the URL, date, page-number lines Chrome/Firefox add by default).
   We restore inner breathing room with padding on the Page wrapper.          */
const PrintStyles = createGlobalStyle`
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    html, body {
      background: #fff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-print { display: none !important; }
  }
`;

const Page = styled.div`
  min-height: 100vh;
  background: #f4f6f8;
  padding: 32px 20px 60px;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  @media print {
    background: #fff;
    padding: 12mm 14mm;
  }
`;

const Toolbar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  max-width: 900px; margin: 0 auto 22px;
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
  padding: 8px 18px; border-radius: 8px; cursor: pointer;
  font-size: 0.84rem; font-weight: 500; font-family: inherit;
  border: 1px solid ${({ $primary }) => $primary ? '#465fff' : '#d1d5db'};
  background: ${({ $primary }) => $primary ? '#465fff' : '#fff'};
  color: ${({ $primary }) => $primary ? '#fff' : '#374151'};
  &:hover { opacity: 0.88; }
`;

const Card = styled.div`
  max-width: 900px; margin: 0 auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  @media print { border: none; border-radius: 0; max-width: 100%; box-shadow: none; }
`;

/* Top bar — "Invoice" title on left, "ID : #XXX" on right */
const CardHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 32px;
  border-bottom: 1px solid #f0f2f5;
`;

const InvoiceTitle = styled.div`
  font-size: 1.2rem; font-weight: 700; color: #111827;
`;

const InvoiceId = styled.div`
  font-size: 0.95rem; font-weight: 600; color: #374151;
`;

/* From / To row with a vertical divider in the middle */
const MetaRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  padding: 28px 32px;
  border-bottom: 1px solid #f0f2f5;
  @media (max-width: 600px) { grid-template-columns: 1fr; gap: 24px; }
`;

const MetaBlock = styled.div<{ $right?: boolean }>`
  text-align: ${({ $right }) => $right ? 'right' : 'left'};
`;

const VerticalDivider = styled.div`
  width: 1px; background: #e5e7eb; margin: 0 32px;
  @media (max-width: 600px) { display: none; }
`;

const MetaLabel = styled.div`
  font-size: 0.78rem; font-weight: 600; color: #6b7280;
  margin-bottom: 4px;
`;

const MetaName = styled.div`
  font-size: 0.95rem; font-weight: 700; color: #111827;
  margin-bottom: 3px;
`;

const MetaText = styled.div`
  font-size: 0.82rem; color: #6b7280; line-height: 1.65;
`;

/* Items table */
const TableSection = styled.div`padding: 0 0;`;

const Table = styled.table`width: 100%; border-collapse: collapse;`;

const THead = styled.thead`background: #f9fafb;`;

const TH = styled.th<{ $right?: boolean; $center?: boolean }>`
  text-align: ${({ $right, $center }) => $right ? 'right' : $center ? 'center' : 'left'};
  font-size: 0.78rem; font-weight: 600; color: #6b7280;
  padding: 11px 20px;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
`;

const TR = styled.tr`
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; }
`;

const TD = styled.td<{ $right?: boolean; $center?: boolean; $bold?: boolean }>`
  text-align: ${({ $right, $center }) => $right ? 'right' : $center ? 'center' : 'left'};
  font-size: 0.875rem;
  color: ${({ $bold }) => $bold ? '#111827' : '#374151'};
  font-weight: ${({ $bold }) => $bold ? 700 : 400};
  padding: 15px 20px;
`;

const ItemWrap = styled.div`display: flex; align-items: center; gap: 10px;`;

const ItemImg = styled.img`
  width: 32px; height: 32px; border-radius: 6px; object-fit: cover;
  border: 1px solid #e5e7eb; flex-shrink: 0;
  @media print { display: none; }
`;

const ItemEmoji = styled.div`
  width: 32px; height: 32px; border-radius: 6px;
  background: #f3f4f6; display: flex; align-items: center;
  justify-content: center; font-size: 16px; flex-shrink: 0;
  @media print { display: none; }
`;

/* Summary */
const SummarySection = styled.div`
  display: flex; justify-content: flex-end;
  padding: 22px 32px 28px;
  border-top: 1px solid #f0f2f5;
`;

const SummaryBox = styled.div`min-width: 260px;`;

const SummaryTitle = styled.div`
  font-size: 0.82rem; font-weight: 700; color: #374151;
  margin-bottom: 12px; text-align: right;
`;

const SumLine = styled.div<{ $total?: boolean }>`
  display: flex; justify-content: space-between; align-items: center;
  padding: ${({ $total }) => $total ? '13px 0 0' : '5px 0'};
  ${({ $total }) => $total && 'border-top: 2px solid #111827; margin-top: 8px;'}
`;

const SumKey = styled.span<{ $total?: boolean }>`
  font-size: ${({ $total }) => $total ? '0.92rem' : '0.83rem'};
  font-weight: ${({ $total }) => $total ? 700 : 400};
  color: ${({ $total }) => $total ? '#111827' : '#6b7280'};
`;

const SumVal = styled.span<{ $total?: boolean }>`
  font-size: ${({ $total }) => $total ? '1.05rem' : '0.83rem'};
  font-weight: ${({ $total }) => $total ? 700 : 500};
  color: ${({ $total }) => $total ? '#111827' : '#374151'};
`;

const FootNote = styled.div`
  font-size: 0.8rem; color: #9ca3af; text-align: center;
  padding: 18px 32px 24px;
  border-top: 1px solid #f0f2f5;
  line-height: 1.65;
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
  card: 'Card', apple_pay: 'Apple Pay', google_pay: 'Google Pay',
  paypal: 'PayPal', klarna: 'Klarna', revolut: 'Revolut',
  sepa_debit: 'SEPA Debit', ideal: 'iDEAL', bancontact: 'Bancontact',
  sofort: 'SOFORT', giropay: 'Giropay', eps: 'EPS',
  przelewy24: 'Przelewy24', blik: 'BLIK', cod: 'Cash on Delivery',
  bank: 'Bank Transfer',
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

  return (
    <>
      <PrintStyles />
      <Page>

        {/* Toolbar — hidden on print */}
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

          {/* "Invoice" title + ID */}
          <CardHeader>
            <InvoiceTitle>Invoice</InvoiceTitle>
            <InvoiceId>ID : #{invNum}</InvoiceId>
          </CardHeader>

          {/* From / divider / To */}
          <MetaRow>
            <MetaBlock>
              <MetaLabel>From</MetaLabel>
              <MetaName>{storeName}</MetaName>
              <MetaText>
                {storeAddress}
                {storeEmail && <><br />{storeEmail}</>}
                {storePhone && <><br />{storePhone}</>}
              </MetaText>
              <div style={{ marginTop: 18 }}>
                <MetaLabel>Issued On:</MetaLabel>
                <MetaText style={{ color: '#111827', fontWeight: 500 }}>{fmtDate(order.createdAt)}</MetaText>
              </div>
            </MetaBlock>

            <VerticalDivider />

            <MetaBlock $right>
              <MetaLabel>To</MetaLabel>
              <MetaName>{order.userName || '—'}</MetaName>
              <MetaText>
                {order.userEmail && <>{order.userEmail}<br /></>}
                {customerAddr}
              </MetaText>
              <div style={{ marginTop: 18 }}>
                <MetaLabel>Due On:</MetaLabel>
                <MetaText style={{ color: '#111827', fontWeight: 500 }}>{addDays(order.createdAt, 5)}</MetaText>
              </div>
            </MetaBlock>
          </MetaRow>

          {/* Items */}
          <TableSection>
            <Table>
              <THead>
                <tr>
                  <TH style={{ width: 70 }}>S.No.#</TH>
                  <TH>Products</TH>
                  <TH $center style={{ width: 100 }}>Quantity</TH>
                  <TH $right style={{ width: 120 }}>Unit Cost</TH>
                  <TH $right style={{ width: 120 }}>Total</TH>
                </tr>
              </THead>
              <tbody>
                {order.items.map((item, i) => (
                  <TR key={i}>
                    <TD style={{ color: '#9ca3af' }}>{i + 1}</TD>
                    <TD>
                      <ItemWrap>
                        {item.image
                          ? <ItemImg src={item.image} alt={item.name}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <ItemEmoji>{EMOJI[i % EMOJI.length]}</ItemEmoji>
                        }
                        <span style={{ fontWeight: 600, color: '#111827' }}>{item.name}</span>
                      </ItemWrap>
                    </TD>
                    <TD $center>{item.quantity}</TD>
                    <TD $right>${item.price.toFixed(2)}</TD>
                    <TD $right $bold>${(item.price * item.quantity).toFixed(2)}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </TableSection>

          {/* Order summary*/}
          <SummarySection>
            <SummaryBox>
              <SummaryTitle>Order summary</SummaryTitle>
              <SumLine>
                <SumKey>Sub Total</SumKey>
                <SumVal>${subtotal.toFixed(2)}</SumVal>
              </SumLine>
              {vat > 0 && (
                <SumLine>
                  <SumKey>Vat (10%):</SumKey>
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
                  <SumVal>{PM_LABELS[order.paymentMethod] || order.paymentMethod}</SumVal>
                </SumLine>
              )}
              <SumLine $total>
                <SumKey $total>Total</SumKey>
                <SumVal $total>${total.toFixed(2)}</SumVal>
              </SumLine>
            </SummaryBox>
          </SummarySection>

          <FootNote>
            Thanks for your order! Questions? Reach us{storeEmail ? ` at ${storeEmail}` : ''}.
            {' '}Payment due by <strong>{addDays(order.createdAt, 5)}</strong>.
          </FootNote>

        </Card>
      </Page>
    </>
  );
};

export default InvoicePage;