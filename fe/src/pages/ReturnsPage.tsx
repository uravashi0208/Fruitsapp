import React from 'react';
import styled, { keyframes } from 'styled-components';
import { RefreshCw, CheckCircle, XCircle, Clock, Mail, ArrowRight } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { Container, Section } from '../styles/shared';
import { theme } from '../styles/theme';

const fadeUp = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;

const PageWrap = styled.main`font-family: ${theme.fonts.body};`;

// Policy highlight bar
const PolicyHero = styled.div`
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fde68a; border-radius: 16px; padding: 32px 36px; margin-bottom: 52px;
  display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
`;
const PolicyBadge = styled.div`
  width: 80px; height: 80px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(245,158,11,0.3);
`;
const PolicyDays = styled.div`font-size: 22px; font-weight: 900; color: #fff; line-height: 1;`;
const PolicyDayLabel = styled.div`font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.85); letter-spacing: 0.1em; text-transform: uppercase;`;
const PolicyText = styled.div`flex: 1; min-width: 200px;`;
const PolicyTitle = styled.h3`font-size: 20px; font-weight: 800; color: #92400e; margin-bottom: 8px;`;
const PolicyDesc = styled.p`font-size: 14px; color: #92400e; line-height: 1.7; margin: 0; opacity: 0.85;`;

const SectionHead = styled.div`margin-bottom: 32px;`;
const Label = styled.span`display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: ${theme.colors.primary}; margin-bottom: 10px;`;
const STitle = styled.h2`font-size: clamp(22px,3vw,30px); font-weight: 800; color: ${theme.colors.textDark}; margin-bottom: 10px;`;
const SSub = styled.p`font-size: 15px; color: ${theme.colors.text}; line-height: 1.7;`;

// Eligible / Not eligible columns
const EligibleGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 56px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;
const EligibleCard = styled.div<{ $ok: boolean }>`
  border-radius: 16px; overflow: hidden;
  border: 1px solid ${({ $ok }) => $ok ? '#bbf7d0' : '#fecaca'};
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
`;
const EligibleHead = styled.div<{ $ok: boolean }>`
  padding: 20px 24px; display: flex; align-items: center; gap: 12px;
  background: ${({ $ok }) => $ok ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fff1f2, #fee2e2)'};
`;
const EligibleTitle = styled.h3<{ $ok: boolean }>`
  font-size: 16px; font-weight: 800; margin: 0;
  color: ${({ $ok }) => $ok ? '#166534' : '#991b1b'};
`;
const EligibleBody = styled.div`padding: 16px 24px 24px; background: #fff;`;
const EligibleItem = styled.div<{ $ok: boolean }>`
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid #f5f5f5;
  &:last-child { border-bottom: none; }
`;
const EligibleDot = styled.div<{ $ok: boolean }>`
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
  background: ${({ $ok }) => $ok ? '#dcfce7' : '#fee2e2'};
  display: flex; align-items: center; justify-content: center;
`;
const EligibleText = styled.span`font-size: 13px; color: ${theme.colors.textDark}; line-height: 1.5;`;

// Steps
const StepsWrap = styled.div`margin-bottom: 56px;`;
const Step = styled.div`
  display: flex; gap: 20px; padding: 28px 32px; margin-bottom: 16px;
  background: #fff; border: 1px solid #eee; border-radius: 16px;
  transition: box-shadow 0.2s, transform 0.2s;
  animation: ${fadeUp} 0.4s ease both;
  &:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.07); transform: translateX(4px); }
`;
const StepNum = styled.div`
  width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark});
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 900; color: #fff;
  box-shadow: 0 4px 12px rgba(130,174,70,0.3);
`;
const StepContent = styled.div`flex: 1;`;
const StepTitle = styled.h4`font-size: 15px; font-weight: 700; color: ${theme.colors.textDark}; margin-bottom: 6px;`;
const StepText  = styled.p`font-size: 14px; color: ${theme.colors.text}; line-height: 1.7; margin: 0;`;
const StepTag = styled.span`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  background: ${theme.colors.primaryGhost}; color: ${theme.colors.primaryDark};
  border: 1px solid rgba(130,174,70,0.25); padding: 3px 10px; border-radius: 20px; margin-bottom: 8px;
`;

// Exchange cards
const ExchangeGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 56px; @media(max-width:600px){grid-template-columns:1fr;}`;
const ExchangeCard = styled.div`
  background: #fff; border: 1px solid #eee; border-radius: 16px; padding: 28px 24px;
  border-top: 4px solid ${theme.colors.primary};
  transition: box-shadow 0.2s; &:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.07); }
`;
const ExchangeIcon = styled.div`
  width: 44px; height: 44px; border-radius: 12px;
  background: ${theme.colors.primaryGhost}; display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px; svg { color: ${theme.colors.primary}; }
`;
const ExchangeTitle = styled.h3`font-size: 15px; font-weight: 700; color: ${theme.colors.textDark}; margin-bottom: 10px;`;
const ExchangeText = styled.p`font-size: 14px; color: ${theme.colors.text}; line-height: 1.7; margin: 0;`;

// Refund timeline
const RefundWrap = styled.div`border-radius: 16px; overflow: hidden; border: 1px solid #eee; margin-bottom: 56px; box-shadow: 0 4px 16px rgba(0,0,0,0.04);`;
const RefundRow = styled.div`
  display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 18px 28px; border-bottom: 1px solid #f5f5f5; transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: #fafafa; }
`;
const RefundMethod = styled.span`font-weight: 600; font-size: 14px; color: ${theme.colors.textDark};`;
const RefundTime = styled.span`
  font-size: 13px; color: ${theme.colors.text};
  background: #f8f9fa; padding: 4px 12px; border-radius: 20px;
`;

// Contact CTA
const ContactCTA = styled.div`
  background: linear-gradient(135deg, ${theme.colors.primaryGhost}, rgba(130,174,70,0.05));
  border: 1px solid rgba(130,174,70,0.2); border-radius: 20px;
  padding: 48px 40px; text-align: center; margin-bottom: 16px;
`;
const CTAIcon = styled.div`
  width: 72px; height: 72px; border-radius: 20px; margin: 0 auto 20px;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark});
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(130,174,70,0.35);
`;
const CTATitle = styled.h3`font-size: 24px; font-weight: 800; color: ${theme.colors.textDark}; margin-bottom: 10px;`;
const CTADesc = styled.p`font-size: 15px; color: ${theme.colors.text}; line-height: 1.7; margin-bottom: 28px;`;
const CTABtn = styled.a`
  display: inline-flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark});
  color: #fff; padding: 14px 36px; border-radius: 30px;
  font-weight: 700; font-size: 15px; text-decoration: none;
  box-shadow: 0 6px 20px rgba(130,174,70,0.35);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(130,174,70,0.45); }
`;

const ReturnsPage: React.FC = () => (
  <PageWrap>
    <PageHero title="Returns & Exchange" breadcrumbs={[{ label: 'Returns & Exchange' }]} />

    <Section>
      <Container>

        {/* Policy highlight */}
        <PolicyHero>
          <PolicyBadge>
            <PolicyDays>30</PolicyDays>
            <PolicyDayLabel>Day Returns</PolicyDayLabel>
          </PolicyBadge>
          <PolicyText>
            <PolicyTitle>Hassle-Free 30-Day Return Policy</PolicyTitle>
            <PolicyDesc>
              We stand behind every product we sell. If you're not completely satisfied,
              return eligible items within <strong>30 days</strong> of delivery for a full
              refund or exchange — no questions asked, no drama.
            </PolicyDesc>
          </PolicyText>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Free returns on damaged items', 'Refund within 5 business days', 'Easy exchange process'].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
                <CheckCircle size={14} color="#d97706" /> {b}
              </div>
            ))}
          </div>
        </PolicyHero>

        {/* What can be returned */}
        <SectionHead>
          <Label>Eligibility</Label>
          <STitle>What can be returned?</STitle>
          <SSub>Not all items are eligible due to the perishable nature of fresh produce.</SSub>
        </SectionHead>

        <EligibleGrid>
          <EligibleCard $ok={true}>
            <EligibleHead $ok={true}>
              <CheckCircle size={22} color="#16a34a" />
              <EligibleTitle $ok={true}>Eligible for Return ✓</EligibleTitle>
            </EligibleHead>
            <EligibleBody>
              {['Unopened packaged goods (sauces, oils, dried goods)', 'Damaged or defective items — any category', 'Wrong item received', 'Items not as described on the website', 'Sealed beverages and juices', 'Kitchenware and accessories'].map(item => (
                <EligibleItem key={item} $ok={true}>
                  <EligibleDot $ok={true}><CheckCircle size={11} color="#16a34a" /></EligibleDot>
                  <EligibleText>{item}</EligibleText>
                </EligibleItem>
              ))}
            </EligibleBody>
          </EligibleCard>

          <EligibleCard $ok={false}>
            <EligibleHead $ok={false}>
              <XCircle size={22} color="#dc2626" />
              <EligibleTitle $ok={false}>Not Eligible ✕</EligibleTitle>
            </EligibleHead>
            <EligibleBody>
              {['Fresh fruits and vegetables (perishable)', 'Opened or partially consumed items', 'Items without original packaging', 'Products past their use-by date', 'Items bought on final sale or clearance', 'Gift cards and vouchers'].map(item => (
                <EligibleItem key={item} $ok={false}>
                  <EligibleDot $ok={false}><XCircle size={11} color="#dc2626" /></EligibleDot>
                  <EligibleText>{item}</EligibleText>
                </EligibleItem>
              ))}
            </EligibleBody>
          </EligibleCard>
        </EligibleGrid>

        {/* Steps */}
        <SectionHead>
          <Label>The Process</Label>
          <STitle>How to return an item</STitle>
          <SSub>Four simple steps — takes less than 5 minutes to initiate.</SSub>
        </SectionHead>

        <StepsWrap>
          {[
            { n: 1, tag: 'Within 30 days', title: 'Contact Us', text: 'Email returns@vegefoods.com with your order number and reason. For damaged or wrong items, please attach a photo — it helps us improve.' },
            { n: 2, tag: 'Within 1 business day', title: 'Receive Your Return Label', text: 'We\'ll email you a prepaid return label. Damaged or incorrect items ship back for free. Change-of-mind returns incur a $4.99 label fee.' },
            { n: 3, tag: 'Drop off anytime', title: 'Pack & Ship', text: 'Pack the item securely in its original packaging if possible. Drop it off at any authorised courier point. Keep your tracking receipt.' },
            { n: 4, tag: '3–5 business days', title: 'Refund Processed', text: 'Once we receive and inspect your return, your refund is issued to your original payment method. You\'ll receive a confirmation email.' },
          ].map((s, i) => (
            <Step key={s.n} style={{ animationDelay: `${i * 0.1}s` }}>
              <StepNum>{s.n}</StepNum>
              <StepContent>
                <StepTag>{s.tag}</StepTag>
                <StepTitle>{s.title}</StepTitle>
                <StepText>{s.text}</StepText>
              </StepContent>
              {i < 3 && <ArrowRight size={20} color="#ddd" style={{ flexShrink: 0, marginTop: 14 }} />}
            </Step>
          ))}
        </StepsWrap>

        {/* Exchanges */}
        <SectionHead>
          <Label>Exchanges</Label>
          <STitle>Want a different product?</STitle>
          <SSub>We make exchanges quick and easy — no need to wait for a refund first.</SSub>
        </SectionHead>

        <ExchangeGrid>
          <ExchangeCard>
            <ExchangeIcon><RefreshCw size={22} /></ExchangeIcon>
            <ExchangeTitle>Same-Value Exchange</ExchangeTitle>
            <ExchangeText>Exchange for any product of equal or lesser value at no extra charge. Mention your preferred replacement in your return email and we'll dispatch it immediately upon receiving your return.</ExchangeText>
          </ExchangeCard>
          <ExchangeCard>
            <ExchangeIcon><Clock size={22} /></ExchangeIcon>
            <ExchangeTitle>Exchange Timeline</ExchangeTitle>
            <ExchangeText>Exchange items are dispatched within 1–2 business days of us receiving your return. You'll receive a new tracking number by email once your replacement is on its way.</ExchangeText>
          </ExchangeCard>
        </ExchangeGrid>

        {/* Refund timeline */}
        <SectionHead>
          <Label>Refunds</Label>
          <STitle>Refund timeline by payment method</STitle>
        </SectionHead>

        <RefundWrap>
          {[
            { method: 'Credit / Debit Card', time: '3–5 business days after return received' },
            { method: 'PayPal', time: '1–3 business days after return received' },
            { method: 'BLIK / Przelewy24', time: '2–4 business days after return received' },
            { method: 'Store Credit', time: 'Instant upon return approval' },
            { method: 'Cash on Delivery (COD)', time: 'Bank transfer within 5 business days' },
          ].map(({ method, time }) => (
            <RefundRow key={method}>
              <RefundMethod>{method}</RefundMethod>
              <RefundTime>{time}</RefundTime>
            </RefundRow>
          ))}
        </RefundWrap>

        {/* Contact CTA */}
        <ContactCTA>
          <CTAIcon><Mail size={32} color="#fff" /></CTAIcon>
          <CTATitle>Need help with a return?</CTATitle>
          <CTADesc>
            Our support team is available Monday–Friday, 9:00 AM – 6:00 PM.<br />
            We aim to respond to all return queries within 4 hours.
          </CTADesc>
          <CTABtn href="mailto:returns@vegefoods.com">
            <Mail size={16} /> Email returns@vegefoods.com <ArrowRight size={16} />
          </CTABtn>
        </ContactCTA>

      </Container>
    </Section>
    <NewsletterSection />
  </PageWrap>
);

export default ReturnsPage;