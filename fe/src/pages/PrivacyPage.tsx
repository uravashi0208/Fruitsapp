import React from 'react';
import styled from 'styled-components';
import { Shield, Eye, Lock, Database, Bell, UserX, Globe } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { Container, Section } from '../styles/shared';
import { theme } from '../styles/theme';

const PageWrap = styled.main`font-family: ${theme.fonts.body};`;

const LastUpdated = styled.p`
  font-size: 13px; color: ${theme.colors.textLight}; margin-bottom: 36px;
  padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;
`;

const HeroCardGrid = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 52px;
  @media (max-width: ${theme.breakpoints.md}) { grid-template-columns: 1fr 1fr; }
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

const HeroCard = styled.div`
  background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 24px;
  text-align: center; transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
`;

const HeroIcon = styled.div`
  width: 52px; height: 52px; border-radius: 50%;
  background: ${theme.colors.primaryGhost}; margin: 0 auto 14px;
  display: flex; align-items: center; justify-content: center;
  svg { color: ${theme.colors.primary}; }
`;

const HeroCardTitle = styled.h3`font-size: 14px; font-weight: 700; color: ${theme.colors.textDark}; margin-bottom: 6px;`;
const HeroCardText  = styled.p`font-size: 13px; color: ${theme.colors.text}; line-height: 1.6; margin: 0;`;

const SectionBlock = styled.div`margin-bottom: 44px; scroll-margin-top: 80px;`;

const SectionTitle = styled.h2`
  font-size: 20px; font-weight: 700; color: ${theme.colors.textDark}; margin-bottom: 14px;
  display: flex; align-items: center; gap: 10px;
  &::before {
    content: ''; display: inline-block; width: 4px; height: 22px;
    background: ${theme.colors.primary}; border-radius: 2px; flex-shrink: 0;
  }
`;

const BodyText = styled.div`
  font-size: 14px; color: ${theme.colors.text}; line-height: 1.9;
  p { margin-bottom: 12px; }
  ul { padding-left: 20px; margin-bottom: 12px; li { margin-bottom: 6px; } }
`;

const InfoBox = styled.div`
  background: ${theme.colors.primaryGhost}; border-left: 4px solid ${theme.colors.primary};
  padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 16px 0;
  font-size: 14px; color: ${theme.colors.textDark}; line-height: 1.7;
`;

const RightsGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px;
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

const RightCard = styled.div`
  background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; padding: 18px 20px;
  display: flex; gap: 12px;
`;

const RightTitle = styled.h4`font-size: 14px; font-weight: 600; color: ${theme.colors.textDark}; margin-bottom: 5px;`;
const RightText  = styled.p`font-size: 13px; color: ${theme.colors.text}; line-height: 1.6; margin: 0;`;

const cookieRows = [
  { name: 'Session Cookies', purpose: 'Maintain your login session and cart state', duration: 'Session', required: true },
  { name: 'Preference Cookies', purpose: 'Remember your language, currency, and display preferences', duration: '1 year', required: false },
  { name: 'Analytics Cookies', purpose: 'Understand how visitors use our site (anonymised)', duration: '2 years', required: false },
  { name: 'Marketing Cookies', purpose: 'Deliver relevant advertisements on third-party platforms', duration: '90 days', required: false },
];

const CookieTable = styled.table`width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px;`;
const CTH = styled.th`background: ${theme.colors.primary}; color: #fff; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600;`;
const CTD = styled.td`padding: 11px 16px; border-bottom: 1px solid #f0f0f0; color: ${theme.colors.textDark}; vertical-align: top;`;
const CTR = styled.tr`&:nth-child(even) td { background: #fafafa; } &:last-child td { border-bottom: none; }`;

export const PrivacyPage: React.FC = () => (
  <PageWrap>
    <PageHero title="Privacy Policy" breadcrumbs={[{ label: 'Privacy Policy' }]} />

    <Section>
      <Container style={{ maxWidth: 900 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Shield size={28} color={theme.colors.primary} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textDark, margin: 0 }}>
            Privacy Policy
          </h1>
        </div>
        <LastUpdated>
          Last updated: January 1, 2025. This policy explains how Vegefoods collects, uses,
          and protects your personal information.
        </LastUpdated>

        <HeroCardGrid>
          {[
            { icon: <Lock size={22} />, title: 'Data Security', text: 'All data is encrypted in transit using TLS and at rest using AES-256 encryption.' },
            { icon: <Eye size={22} />, title: 'Transparency', text: 'We are clear about what data we collect and exactly how it is used.' },
            { icon: <UserX size={22} />, title: 'Your Control', text: 'You can request access, correction, or deletion of your data at any time.' },
            { icon: <Database size={22} />, title: 'No Selling', text: 'We never sell your personal data to third parties. Period.' },
            { icon: <Globe size={22} />, title: 'GDPR Compliant', text: 'We comply with GDPR and applicable data protection regulations.' },
            { icon: <Bell size={22} />, title: 'Notifications', text: 'We only send marketing emails with your explicit consent. Opt out anytime.' },
          ].map(card => (
            <HeroCard key={card.title}>
              <HeroIcon>{card.icon}</HeroIcon>
              <HeroCardTitle>{card.title}</HeroCardTitle>
              <HeroCardText>{card.text}</HeroCardText>
            </HeroCard>
          ))}
        </HeroCardGrid>

        <SectionBlock id="collect">
          <SectionTitle>1. Information We Collect</SectionTitle>
          <BodyText>
            <p>We collect information you provide directly to us and information generated through your use of our Service.</p>
            <p><strong>Information you provide:</strong></p>
            <ul>
              <li>Name, email address, and password when you register an account</li>
              <li>Delivery address, phone number, and billing information when you place an order</li>
              <li>Payment information (processed securely by Stripe — we never store full card details)</li>
              <li>Product reviews, ratings, and feedback you submit</li>
              <li>Communications you send to our support team</li>
            </ul>
            <p><strong>Information collected automatically:</strong></p>
            <ul>
              <li>IP address, browser type, and operating system</li>
              <li>Pages visited, time spent on pages, and referring URLs</li>
              <li>Device identifiers and cookie data</li>
              <li>Purchase history and browsing behaviour on our site</li>
            </ul>
            <InfoBox>
              We do not collect sensitive personal data such as racial or ethnic origin, political opinions,
              health information, or biometric data.
            </InfoBox>
          </BodyText>
        </SectionBlock>

        <SectionBlock id="use">
          <SectionTitle>2. How We Use Your Information</SectionTitle>
          <BodyText>
            <p>We use collected information to:</p>
            <ul>
              <li><strong>Process orders</strong> — fulfil purchases, process payments, and arrange delivery</li>
              <li><strong>Manage your account</strong> — create and maintain your customer profile</li>
              <li><strong>Customer support</strong> — respond to enquiries, returns, and complaints</li>
              <li><strong>Improve our Service</strong> — analyse usage patterns to enhance user experience</li>
              <li><strong>Marketing</strong> — send promotional emails and offers (only with your consent)</li>
              <li><strong>Legal compliance</strong> — meet our legal and regulatory obligations</li>
              <li><strong>Fraud prevention</strong> — detect and prevent fraudulent transactions</li>
            </ul>
          </BodyText>
        </SectionBlock>

        <SectionBlock id="sharing">
          <SectionTitle>3. Sharing Your Information</SectionTitle>
          <BodyText>
            <p>We do not sell, trade, or rent your personal information. We share data only with trusted partners necessary to deliver our Service:</p>
            <ul>
              <li><strong>Payment processors</strong> (Stripe) — for secure payment handling</li>
              <li><strong>Delivery partners</strong> — to fulfil and track your orders</li>
              <li><strong>Email service providers</strong> — to send order confirmations and newsletters</li>
              <li><strong>Analytics providers</strong> (Google Analytics) — for anonymised site analytics</li>
              <li><strong>Legal authorities</strong> — when required by law or to protect rights</li>
            </ul>
            <p>All third-party partners are contractually required to handle your data securely and in compliance with applicable privacy laws.</p>
          </BodyText>
        </SectionBlock>

        <SectionBlock id="cookies">
          <SectionTitle>4. Cookies</SectionTitle>
          <BodyText>
            <p>
              We use cookies to improve your experience, remember your preferences, and analyse site traffic.
              You can control cookie settings through your browser preferences at any time.
            </p>
            <CookieTable>
              <thead>
                <tr>
                  <CTH>Cookie Type</CTH>
                  <CTH>Purpose</CTH>
                  <CTH>Duration</CTH>
                  <CTH>Required</CTH>
                </tr>
              </thead>
              <tbody>
                {cookieRows.map(row => (
                  <CTR key={row.name}>
                    <CTD><strong>{row.name}</strong></CTD>
                    <CTD>{row.purpose}</CTD>
                    <CTD>{row.duration}</CTD>
                    <CTD>
                      <span style={{
                        color: row.required ? theme.colors.primary : '#6b7280',
                        fontWeight: 600, fontSize: 12,
                      }}>
                        {row.required ? '✓ Required' : 'Optional'}
                      </span>
                    </CTD>
                  </CTR>
                ))}
              </tbody>
            </CookieTable>
          </BodyText>
        </SectionBlock>

        <SectionBlock id="retention">
          <SectionTitle>5. Data Retention</SectionTitle>
          <BodyText>
            <p>We retain your personal data only as long as necessary for the purposes it was collected:</p>
            <ul>
              <li>Account data is retained while your account is active and for 3 years after closure</li>
              <li>Order data is retained for 7 years for accounting and legal compliance</li>
              <li>Marketing consent records are retained indefinitely as proof of consent</li>
              <li>Support tickets are retained for 2 years</li>
            </ul>
          </BodyText>
        </SectionBlock>

        <SectionBlock id="rights">
          <SectionTitle>6. Your Rights</SectionTitle>
          <BodyText>
            <p>Under GDPR and applicable laws, you have the following rights regarding your personal data:</p>
          </BodyText>
          <RightsGrid>
            {[
              { icon: '👁', title: 'Right to Access', text: 'Request a copy of all personal data we hold about you.' },
              { icon: '✏️', title: 'Right to Rectification', text: 'Request correction of inaccurate or incomplete data.' },
              { icon: '🗑️', title: 'Right to Erasure', text: 'Request deletion of your personal data ("right to be forgotten").' },
              { icon: '⏸️', title: 'Right to Restrict', text: 'Request that we limit how we process your data.' },
              { icon: '📦', title: 'Right to Portability', text: 'Receive your data in a structured, machine-readable format.' },
              { icon: '🚫', title: 'Right to Object', text: 'Object to processing of your data for marketing purposes.' },
            ].map(r => (
              <RightCard key={r.title}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <RightTitle>{r.title}</RightTitle>
                  <RightText>{r.text}</RightText>
                </div>
              </RightCard>
            ))}
          </RightsGrid>
          <BodyText>
            <InfoBox style={{ marginTop: 24 }}>
              To exercise any of these rights, email us at <strong>privacy@vegefoods.com</strong>.
              We will respond within 30 days. There is no charge for most requests.
            </InfoBox>
          </BodyText>
        </SectionBlock>

        <SectionBlock id="security">
          <SectionTitle>7. Security</SectionTitle>
          <BodyText>
            <p>
              We implement appropriate technical and organisational measures to protect your data against
              unauthorised access, alteration, disclosure, or destruction. These include:
            </p>
            <ul>
              <li>TLS/SSL encryption for all data in transit</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls — only authorised personnel can access customer data</li>
              <li>PCI-DSS compliant payment processing via Stripe</li>
            </ul>
            <p>
              However, no method of internet transmission is 100% secure. While we strive to protect
              your data, we cannot guarantee absolute security.
            </p>
          </BodyText>
        </SectionBlock>

        <SectionBlock id="children">
          <SectionTitle>8. Children's Privacy</SectionTitle>
          <BodyText>
            <p>
              Our Service is not directed to individuals under the age of 16. We do not knowingly collect
              personal information from children. If we become aware that a child under 16 has provided
              personal data, we will delete it promptly.
            </p>
          </BodyText>
        </SectionBlock>

        <SectionBlock id="contact">
          <SectionTitle>9. Contact & Data Controller</SectionTitle>
          <BodyText>
            <p>If you have questions about this Privacy Policy or wish to exercise your rights, contact our Data Protection Officer:</p>
            <ul>
              <li><strong>Email:</strong> privacy@vegefoods.com</li>
              <li><strong>Post:</strong> Data Protection Officer, Vegefoods, 203 Fake St., Mountain View, San Francisco, CA, USA</li>
              <li><strong>Response time:</strong> Within 30 days of your request</li>
            </ul>
            <p>You also have the right to lodge a complaint with your local data protection supervisory authority.</p>
          </BodyText>
        </SectionBlock>

      </Container>
    </Section>

    <NewsletterSection />
  </PageWrap>
);

export default PrivacyPage;
