import React from 'react';
import styled from 'styled-components';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Mail } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { Container, Section } from '../styles/shared';
import { theme } from '../styles/theme';

const PageWrap = styled.main`font-family: ${theme.fonts.body};`;

const Grid2 = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 48px;
  @media (max-width: ${theme.breakpoints.md}) { grid-template-columns: 1fr; }
`;

const Card = styled.div<{ $accent?: string }>`
  background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 28px;
  border-top: 4px solid ${({ $accent }) => $accent || theme.colors.primary};
`;

const SectionTitle = styled.h2`
  font-size: 26px; font-weight: 700; color: ${theme.colors.textDark};
  margin-bottom: 8px; font-family: ${theme.fonts.body};
`;

const SectionSub = styled.p`
  font-size: 15px; color: ${theme.colors.text}; margin-bottom: 36px; line-height: 1.7;
`;

const CardTitle = styled.h3`font-size: 17px; font-weight: 600; color: ${theme.colors.textDark}; margin: 0 0 12px;`;
const CardText  = styled.p`font-size: 14px; color: ${theme.colors.text}; line-height: 1.8; margin: 0;`;

const StepWrap = styled.div`display: flex; flex-direction: column; gap: 0; margin-bottom: 48px;`;

const Step = styled.div`
  display: flex; gap: 20px; padding: 24px 0;
  border-bottom: 1px solid #f0f0f0; &:last-child { border-bottom: none; }
`;

const StepNum = styled.div`
  width: 40px; height: 40px; border-radius: 50%; background: ${theme.colors.primary};
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 16px; flex-shrink: 0; margin-top: 2px;
`;

const StepTitle = styled.h4`font-size: 15px; font-weight: 600; color: ${theme.colors.textDark}; margin-bottom: 6px;`;
const StepText  = styled.p`font-size: 14px; color: ${theme.colors.text}; line-height: 1.7; margin: 0;`;

const Tag = styled.span<{ $ok: boolean }>`
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 20px;
  background: ${({ $ok }) => $ok ? '#f0fdf4' : '#fef2f2'};
  color: ${({ $ok }) => $ok ? '#16a34a' : '#dc2626'};
  border: 1px solid ${({ $ok }) => $ok ? '#bbf7d0' : '#fecaca'};
  margin: 4px 4px 4px 0;
`;

const PolicyBox = styled.div`
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
  padding: 20px 24px; margin-bottom: 48px; display: flex; gap: 14px;
`;

const ContactBox = styled.div`
  background: ${theme.colors.primaryGhost}; border: 1px solid ${theme.colors.primaryLight};
  border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 16px;
`;

export const ReturnsPage: React.FC = () => (
  <PageWrap>
    <PageHero title="Returns & Exchange" breadcrumbs={[{ label: 'Returns & Exchange' }]} />

    <Section>
      <Container>

        <PolicyBox>
          <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 600, color: '#92400e', marginBottom: 4, fontSize: 15 }}>
              30-Day Return Policy
            </p>
            <p style={{ fontSize: 14, color: '#92400e', lineHeight: 1.7, margin: 0 }}>
              We stand behind the quality of every product we sell. If you are not completely
              satisfied, you may return eligible items within <strong>30 days</strong> of delivery
              for a full refund or exchange — no hassle, no questions asked.
            </p>
          </div>
        </PolicyBox>

        <SectionTitle>What Can Be Returned?</SectionTitle>
        <SectionSub>Not all items are eligible for return due to the perishable nature of fresh produce.</SectionSub>

        <Grid2>
          <Card $accent={theme.colors.primary}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <CheckCircle size={20} color={theme.colors.primary} />
              <CardTitle style={{ margin: 0 }}>Eligible for Return</CardTitle>
            </div>
            {['Unopened packaged goods (sauces, oils, dried goods)', 'Damaged or defective items — any category', 'Wrong item received', 'Items not as described', 'Sealed beverages and juices', 'Kitchenware and accessories'].map(i => (
              <Tag key={i} $ok>✓ {i}</Tag>
            ))}
          </Card>
          <Card $accent="#dc2626">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <XCircle size={20} color="#dc2626" />
              <CardTitle style={{ margin: 0 }}>Not Eligible</CardTitle>
            </div>
            {['Fresh fruits and vegetables (perishable)', 'Opened or partially consumed items', 'Items without original packaging', 'Products past their use-by date', 'Items bought on final sale / clearance', 'Gift cards and vouchers'].map(i => (
              <Tag key={i} $ok={false}>✕ {i}</Tag>
            ))}
          </Card>
        </Grid2>

        <SectionTitle>How to Return an Item</SectionTitle>
        <SectionSub>The process is simple and takes less than 5 minutes to initiate.</SectionSub>

        <StepWrap>
          {[
            {
              n: 1, title: 'Contact Us Within 30 Days',
              text: 'Email us at returns@vegefoods.com with your order number and reason for return. For damaged or incorrect items, please attach a photo — this helps us improve.',
            },
            {
              n: 2, title: 'Receive Your Return Label',
              text: 'We\'ll email you a prepaid return shipping label within 1 business day. For damaged/wrong items, return shipping is always free. For change-of-mind returns, a $4.99 return label fee applies.',
            },
            {
              n: 3, title: 'Pack & Ship Your Item',
              text: 'Pack the item securely in its original packaging if possible. Drop it off at any authorised courier point. Keep your tracking receipt for reference.',
            },
            {
              n: 4, title: 'Refund Processed',
              text: 'Once we receive and inspect your return (1–2 business days), your refund will be issued to your original payment method within 3–5 business days. You\'ll receive a confirmation email.',
            },
          ].map(s => (
            <Step key={s.n}>
              <StepNum>{s.n}</StepNum>
              <div>
                <StepTitle>{s.title}</StepTitle>
                <StepText>{s.text}</StepText>
              </div>
            </Step>
          ))}
        </StepWrap>

        <SectionTitle>Exchanges</SectionTitle>
        <SectionSub>Want a different product instead of a refund? We make exchanges easy.</SectionSub>

        <Grid2>
          <Card>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <RefreshCw size={20} color={theme.colors.primary} />
              <CardTitle style={{ margin: 0 }}>Same-Value Exchange</CardTitle>
            </div>
            <CardText>
              Exchange your item for any product of equal or lesser value at no extra charge.
              Simply mention your preferred replacement in your return request email and we'll
              dispatch it as soon as we receive your return.
            </CardText>
          </Card>
          <Card>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <Clock size={20} color={theme.colors.primary} />
              <CardTitle style={{ margin: 0 }}>Exchange Timeline</CardTitle>
            </div>
            <CardText>
              Exchange items are typically dispatched within 1–2 business days of us receiving
              your return. You'll receive a new tracking number by email once your replacement
              is on its way.
            </CardText>
          </Card>
        </Grid2>

        <SectionTitle>Refund Timeline</SectionTitle>
        <div style={{ marginBottom: 48 }}>
          {[
            { method: 'Credit / Debit Card', time: '3–5 business days after return received' },
            { method: 'PayPal', time: '1–3 business days after return received' },
            { method: 'BLIK / Przelewy24', time: '2–4 business days after return received' },
            { method: 'Store Credit', time: 'Instant upon return approval' },
            { method: 'Cash on Delivery (COD)', time: 'Bank transfer within 5 business days' },
          ].map(({ method, time }) => (
            <div key={method} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', gap: 8,
            }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: theme.colors.textDark }}>{method}</span>
              <span style={{ fontSize: 13, color: theme.colors.text }}>{time}</span>
            </div>
          ))}
        </div>

        <ContactBox>
          <Mail size={32} color={theme.colors.primary} style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textDark, marginBottom: 8 }}>
            Need Help With a Return?
          </h3>
          <p style={{ fontSize: 14, color: theme.colors.text, marginBottom: 20, lineHeight: 1.7 }}>
            Our support team is available Monday–Friday, 9:00 AM – 6:00 PM.<br />
            We aim to respond to all queries within 4 hours.
          </p>
          <a
            href="mailto:returns@vegefoods.com"
            style={{
              display: 'inline-block', background: theme.colors.primary, color: '#fff',
              padding: '12px 32px', borderRadius: 30, fontWeight: 600, fontSize: 14,
              textDecoration: 'none', transition: 'background 0.2s',
            }}
          >
            Email returns@vegefoods.com
          </a>
        </ContactBox>

      </Container>
    </Section>

    <NewsletterSection />
  </PageWrap>
);

export default ReturnsPage;
