import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Shield, Eye, Lock, Database, Bell, UserX, Globe, CheckCircle } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { Container, Section } from '../styles/shared';
import { theme } from '../styles/theme';

const fadeUp = keyframes`from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}`;

const PageWrap = styled.main`font-family: ${theme.fonts.body};`;

// Trust hero strip
const TrustStrip = styled.div`
  background: linear-gradient(135deg, #1a2e0a, #2d4f12);
  padding: 40px 0; margin-bottom: 0;
`;
const TrustGrid = styled.div`
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 0;
  @media (max-width: 900px) { grid-template-columns: repeat(3,1fr); }
  @media (max-width: 480px) { grid-template-columns: repeat(2,1fr); }
`;
const TrustItem = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 16px 12px; text-align: center;
  border-right: 1px solid rgba(255,255,255,0.1);
  &:last-child { border-right: none; }
`;
const TrustIcon = styled.div`
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(130,174,70,0.2); border: 1px solid rgba(130,174,70,0.3);
  display: flex; align-items: center; justify-content: center;
  svg { color: #a8cc70; }
`;
const TrustLabel = styled.div`font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.9); line-height: 1.3;`;
const TrustSub = styled.div`font-size: 10px; color: rgba(255,255,255,0.45); line-height: 1.4;`;

const Layout = styled.div`
  display: grid; grid-template-columns: 240px 1fr; gap: 48px; align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const TOCSidebar = styled.div`position: sticky; top: 100px; @media (max-width: 900px) { position: relative; top: 0; }`;
const TOCCard = styled.div`background: #fff; border: 1px solid #eee; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);`;
const TOCHeader = styled.div`padding: 16px 20px; background: linear-gradient(135deg, ${theme.colors.textDark}, #2d2d2d); display: flex; align-items: center; gap: 10px;`;
const TOCHeaderTitle = styled.span`font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.75); letter-spacing: 0.1em; text-transform: uppercase;`;
const TOCList = styled.nav`padding: 10px 0;`;
const TOCItem = styled.a<{ $active?: boolean }>`
  display: flex; align-items: center; gap: 10px; padding: 9px 18px;
  font-size: 13px; color: ${({ $active }) => $active ? theme.colors.primary : theme.colors.textDark};
  font-weight: ${({ $active }) => $active ? '700' : '400'};
  text-decoration: none; transition: all 0.15s;
  background: ${({ $active }) => $active ? theme.colors.primaryGhost : 'transparent'};
  border-left: 3px solid ${({ $active }) => $active ? theme.colors.primary : 'transparent'};
  &:hover { background: #fafafa; color: ${theme.colors.primary}; }
`;


const ContentCard = styled.div`
  background: #fff; border: 1px solid #eee; border-radius: 16px; overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04); margin-bottom: 20px;
  animation: ${fadeUp} 0.4s ease both;
`;

const CardHeader = styled.div`
  display: flex; align-items: center; gap: 14px; padding: 22px 28px;
  border-bottom: 1px solid #f5f5f5;
`;
const CardHeaderIcon = styled.div`
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  background: ${theme.colors.primaryGhost}; display: flex; align-items: center; justify-content: center;
  svg { color: ${theme.colors.primary}; }
`;
const CardHeaderTitle = styled.h2`font-size: 17px; font-weight: 800; color: ${theme.colors.textDark}; margin: 0; flex: 1;`;
const CardBody = styled.div`
  padding: 24px 28px;
  font-size: 14px; color: ${theme.colors.text}; line-height: 1.9;
  p { margin-bottom: 12px; }
  ul { padding-left: 20px; margin-bottom: 12px; li { margin-bottom: 6px; } }
  strong { color: ${theme.colors.textDark}; font-weight: 600; }
`;

const InfoBox = styled.div`
  background: ${theme.colors.primaryGhost}; border-left: 4px solid ${theme.colors.primary};
  padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 12px 0;
  font-size: 14px; color: ${theme.colors.textDark}; line-height: 1.7;
`;

// Cookie table
const CookieTable = styled.div`border-radius: 10px; overflow: hidden; border: 1px solid #eee; margin-top: 16px;`;
const CookieHead = styled.div`display: grid; grid-template-columns: 1.5fr 2fr 1fr 1fr; padding: 12px 16px; background: linear-gradient(135deg, ${theme.colors.textDark}, #2d2d2d);`;
const CookieHeadCell = styled.div`font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.8); letter-spacing: 0.08em; text-transform: uppercase;`;
const CookieRow = styled.div`display: grid; grid-template-columns: 1.5fr 2fr 1fr 1fr; padding: 14px 16px; border-bottom: 1px solid #f5f5f5; &:last-child{border-bottom:none;} &:nth-child(even){background:#fafafa;}`;
const CookieCell = styled.div`font-size: 13px; color: ${theme.colors.textDark};`;

// Rights grid
const RightsGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; @media(max-width:500px){grid-template-columns:1fr;}`;
const RightCard = styled.div`
  display: flex; gap: 12px; padding: 16px 18px;
  background: #fafafa; border: 1px solid #eee; border-radius: 12px;
  transition: all 0.2s; &:hover { border-color: rgba(130,174,70,0.3); background: ${theme.colors.primaryGhost}; }
`;
const RightEmoji = styled.span`font-size: 20px; flex-shrink: 0; margin-top: 2px;`;
const RightTitle = styled.h4`font-size: 13px; font-weight: 700; color: ${theme.colors.textDark}; margin-bottom: 4px;`;
const RightText = styled.p`font-size: 12px; color: ${theme.colors.text}; line-height: 1.5; margin: 0;`;

const sections = [
  { id: 'collect',   icon: <Database size={18} />, title: '1. Information We Collect' },
  { id: 'use',       icon: <Eye size={18} />,      title: '2. How We Use Your Information' },
  { id: 'sharing',   icon: <Globe size={18} />,    title: '3. Sharing Your Information' },
  { id: 'cookies',   icon: <Bell size={18} />,     title: '4. Cookies' },
  { id: 'retention', icon: <Database size={18} />, title: '5. Data Retention' },
  { id: 'rights',    icon: <UserX size={18} />,    title: '6. Your Rights' },
  { id: 'security',  icon: <Lock size={18} />,     title: '7. Security' },
  { id: 'children',  icon: <Shield size={18} />,   title: '8. Children\'s Privacy' },
  { id: 'contact',   icon: <Shield size={18} />,   title: '9. Contact & Data Controller' },
];

const cookieRows = [
  { name: 'Session Cookies',     purpose: 'Maintain your login session and cart state',            duration: 'Session', required: true },
  { name: 'Preference Cookies',  purpose: 'Remember language, currency, and display preferences', duration: '1 year',  required: false },
  { name: 'Analytics Cookies',   purpose: 'Understand how visitors use our site (anonymised)',    duration: '2 years', required: false },
  { name: 'Marketing Cookies',   purpose: 'Deliver relevant ads on third-party platforms',        duration: '90 days', required: false },
];

const PrivacyPage: React.FC = () => {
  const [activeId, setActiveId] = useState('collect');

  return (
    <PageWrap>
      <PageHero title="Privacy Policy" breadcrumbs={[{ label: 'Privacy Policy' }]} />

      {/* Trust strip */}
      <TrustStrip>
        <Container>
          <TrustGrid>
            {[
              { icon: <Lock size={18} />,   label: 'TLS Encrypted', sub: 'All data in transit' },
              { icon: <Eye size={18} />,    label: 'Transparent',   sub: 'Clear data practices' },
              { icon: <UserX size={18} />,  label: 'Your Control',  sub: 'Access, edit, delete' },
              { icon: <Database size={18}/>, label: 'Never Sold',   sub: 'Your data stays yours' },
              { icon: <Globe size={18} />,  label: 'GDPR Ready',    sub: 'Fully compliant' },
              { icon: <Bell size={18} />,   label: 'Opt-Out Easy',  sub: 'Unsubscribe anytime' },
            ].map(t => (
              <TrustItem key={t.label}>
                <TrustIcon>{t.icon}</TrustIcon>
                <div>
                  <TrustLabel>{t.label}</TrustLabel>
                  <TrustSub>{t.sub}</TrustSub>
                </div>
              </TrustItem>
            ))}
          </TrustGrid>
        </Container>
      </TrustStrip>

      <Section>
        <Container>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: theme.colors.textDark, margin: 0 }}>Privacy Policy</h1>
          </div>
          <div style={{ fontSize: 13, color: theme.colors.text, marginBottom: 40, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
            Last updated: <strong>January 1, 2025.</strong> This policy explains how Vegefoods collects, uses, and protects your personal information.
          </div>

          <Layout>
            {/* TOC */}
            <TOCSidebar>
              <TOCCard>
                <TOCHeader>
                  <Shield size={13} color="rgba(255,255,255,0.7)" />
                  <TOCHeaderTitle>Sections</TOCHeaderTitle>
                </TOCHeader>
                <TOCList>
                  {sections.map(s => (
                    <TOCItem key={s.id} href={`#${s.id}`} $active={activeId === s.id}
                      onClick={(e) => { e.preventDefault(); setActiveId(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
                      {s.title}
                    </TOCItem>
                  ))}
                </TOCList>
              </TOCCard>
              <div style={{ marginTop: 16, padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircle size={14} color="#16a34a" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>GDPR Compliant</span>
                </div>
                <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.6, margin: 0, opacity: 0.85 }}>
                  To exercise your data rights, email <strong>privacy@vegefoods.com</strong>. We respond within 30 days.
                </p>
              </div>
            </TOCSidebar>

            {/* Content */}
            <div>
              <ContentCard id="collect" style={{ animationDelay: '0s' }}>
                <CardHeader>
                  <CardHeaderIcon><Database size={18} /></CardHeaderIcon>
                  <CardHeaderTitle>1. Information We Collect</CardHeaderTitle>
                </CardHeader>
                <CardBody>
                  <p><strong>Information you provide:</strong></p>
                  <ul>
                    <li>Name, email address, and password when you register</li>
                    <li>Delivery address, phone number, and billing information for orders</li>
                    <li>Payment info (handled by Stripe — we never store full card details)</li>
                    <li>Product reviews, ratings, and support communications</li>
                  </ul>
                  <p><strong>Information collected automatically:</strong></p>
                  <ul>
                    <li>IP address, browser type, and operating system</li>
                    <li>Pages visited, time on page, and referring URLs</li>
                    <li>Purchase history and browsing behaviour</li>
                  </ul>
                  <InfoBox>We do not collect sensitive personal data such as racial origin, political opinions, health information, or biometric data.</InfoBox>
                </CardBody>
              </ContentCard>

              <ContentCard id="use" style={{ animationDelay: '0.06s' }}>
                <CardHeader>
                  <CardHeaderIcon><Eye size={18} /></CardHeaderIcon>
                  <CardHeaderTitle>2. How We Use Your Information</CardHeaderTitle>
                </CardHeader>
                <CardBody>
                  <ul>
                    <li><strong>Process orders</strong> — fulfil purchases, process payments, arrange delivery</li>
                    <li><strong>Manage your account</strong> — create and maintain your customer profile</li>
                    <li><strong>Customer support</strong> — respond to enquiries, returns, and complaints</li>
                    <li><strong>Improve our Service</strong> — analyse usage to enhance user experience</li>
                    <li><strong>Marketing</strong> — send promotional emails (only with your consent)</li>
                    <li><strong>Fraud prevention</strong> — detect and prevent fraudulent transactions</li>
                  </ul>
                </CardBody>
              </ContentCard>

              <ContentCard id="sharing" style={{ animationDelay: '0.12s' }}>
                <CardHeader>
                  <CardHeaderIcon><Globe size={18} /></CardHeaderIcon>
                  <CardHeaderTitle>3. Sharing Your Information</CardHeaderTitle>
                </CardHeader>
                <CardBody>
                  <p>We do not sell, trade, or rent your personal information. We share data only with trusted partners:</p>
                  <ul>
                    <li><strong>Payment processors</strong> (Stripe) — for secure payment handling</li>
                    <li><strong>Delivery partners</strong> — to fulfil and track your orders</li>
                    <li><strong>Email service providers</strong> — for order confirmations and newsletters</li>
                    <li><strong>Analytics providers</strong> (Google Analytics) — anonymised site analytics only</li>
                    <li><strong>Legal authorities</strong> — when required by law</li>
                  </ul>
                  <InfoBox>All third-party partners are contractually required to handle your data securely and in compliance with applicable privacy laws.</InfoBox>
                </CardBody>
              </ContentCard>

              <ContentCard id="cookies" style={{ animationDelay: '0.18s' }}>
                <CardHeader>
                  <CardHeaderIcon><Bell size={18} /></CardHeaderIcon>
                  <CardHeaderTitle>4. Cookies</CardHeaderTitle>
                </CardHeader>
                <CardBody>
                  <p>We use cookies to improve your experience, remember preferences, and analyse traffic. You can control cookie settings through your browser at any time.</p>
                  <CookieTable>
                    <CookieHead>
                      <CookieHeadCell>Type</CookieHeadCell>
                      <CookieHeadCell>Purpose</CookieHeadCell>
                      <CookieHeadCell>Duration</CookieHeadCell>
                      <CookieHeadCell>Required</CookieHeadCell>
                    </CookieHead>
                    {cookieRows.map(row => (
                      <CookieRow key={row.name}>
                        <CookieCell><strong>{row.name}</strong></CookieCell>
                        <CookieCell style={{ fontSize: 12 }}>{row.purpose}</CookieCell>
                        <CookieCell style={{ fontSize: 12 }}>{row.duration}</CookieCell>
                        <CookieCell>
                          <span style={{ fontSize: 12, fontWeight: 700, color: row.required ? '#16a34a' : '#6b7280' }}>
                            {row.required ? '✓ Required' : 'Optional'}
                          </span>
                        </CookieCell>
                      </CookieRow>
                    ))}
                  </CookieTable>
                </CardBody>
              </ContentCard>

              <ContentCard id="retention" style={{ animationDelay: '0.24s' }}>
                <CardHeader>
                  <CardHeaderIcon><Database size={18} /></CardHeaderIcon>
                  <CardHeaderTitle>5. Data Retention</CardHeaderTitle>
                </CardHeader>
                <CardBody>
                  <ul>
                    <li>Account data: retained while active + 3 years after closure</li>
                    <li>Order data: retained for 7 years (accounting & legal compliance)</li>
                    <li>Marketing consent: retained indefinitely as proof of consent</li>
                    <li>Support tickets: retained for 2 years</li>
                  </ul>
                </CardBody>
              </ContentCard>

              <ContentCard id="rights" style={{ animationDelay: '0.30s' }}>
                <CardHeader>
                  <CardHeaderIcon><UserX size={18} /></CardHeaderIcon>
                  <CardHeaderTitle>6. Your Rights (GDPR)</CardHeaderTitle>
                </CardHeader>
                <CardBody>
                  <p>Under GDPR and applicable laws, you have the following rights:</p>
                  <RightsGrid>
                    {[
                      { e: '👁', t: 'Right to Access',       d: 'Request a copy of all personal data we hold about you.' },
                      { e: '✏️', t: 'Right to Rectification', d: 'Request correction of inaccurate or incomplete data.' },
                      { e: '🗑️', t: 'Right to Erasure',      d: 'Request deletion of your data ("right to be forgotten").' },
                      { e: '⏸️', t: 'Right to Restrict',     d: 'Request that we limit how we process your data.' },
                      { e: '📦', t: 'Right to Portability',  d: 'Receive your data in a machine-readable format.' },
                      { e: '🚫', t: 'Right to Object',       d: 'Object to processing your data for marketing.' },
                    ].map(r => (
                      <RightCard key={r.t}>
                        <RightEmoji>{r.e}</RightEmoji>
                        <div><RightTitle>{r.t}</RightTitle><RightText>{r.d}</RightText></div>
                      </RightCard>
                    ))}
                  </RightsGrid>
                  <InfoBox style={{ marginTop: 20 }}>
                    To exercise any right, email <strong>privacy@vegefoods.com</strong>. We respond within 30 days. No charge for most requests.
                  </InfoBox>
                </CardBody>
              </ContentCard>

              <ContentCard id="security" style={{ animationDelay: '0.36s' }}>
                <CardHeader>
                  <CardHeaderIcon><Lock size={18} /></CardHeaderIcon>
                  <CardHeaderTitle>7. Security</CardHeaderTitle>
                </CardHeader>
                <CardBody>
                  <p>We implement technical and organisational safeguards including:</p>
                  <ul>
                    <li>TLS/SSL encryption for all data in transit</li>
                    <li>AES-256 encryption for data at rest</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Strict access controls on customer data</li>
                    <li>PCI-DSS compliant payment processing via Stripe</li>
                  </ul>
                  <p style={{ marginTop: 12 }}>No method of internet transmission is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>
                </CardBody>
              </ContentCard>

              <ContentCard id="children" style={{ animationDelay: '0.42s' }}>
                <CardHeader>
                  <CardHeaderIcon><Shield size={18} /></CardHeaderIcon>
                  <CardHeaderTitle>8. Children's Privacy</CardHeaderTitle>
                </CardHeader>
                <CardBody>
                  <p>Our Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that a child under 16 has provided data, we will delete it promptly.</p>
                </CardBody>
              </ContentCard>

              <ContentCard id="contact" style={{ animationDelay: '0.48s' }}>
                <CardHeader>
                  <CardHeaderIcon><Shield size={18} /></CardHeaderIcon>
                  <CardHeaderTitle>9. Contact & Data Controller</CardHeaderTitle>
                </CardHeader>
                <CardBody>
                  <p>Questions about this Privacy Policy? Contact our Data Protection Officer:</p>
                  <ul>
                    <li><strong>Email:</strong> privacy@vegefoods.com</li>
                    <li><strong>Post:</strong> Data Protection Officer, Vegefoods, 203 Fake St., Mountain View, San Francisco, CA, USA</li>
                    <li><strong>Response time:</strong> Within 30 days of your request</li>
                  </ul>
                  <p>You also have the right to lodge a complaint with your local data protection supervisory authority.</p>
                </CardBody>
              </ContentCard>
            </div>
          </Layout>
        </Container>
      </Section>
      <NewsletterSection />
    </PageWrap>
  );
};

export default PrivacyPage;