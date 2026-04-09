import React, { useState } from 'react';
import { fadeUp } from '../styles/animations';
import styled from 'styled-components';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { Container, Section } from '../styles/shared';
import { theme } from '../styles/theme';


const PageWrap = styled.main`font-family: ${theme.fonts.body};`;

const Layout = styled.div`
  display: grid; grid-template-columns: 260px 1fr; gap: 48px; align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

// Sticky TOC sidebar
const TOCSidebar = styled.div`
  position: sticky; top: 100px;
  @media (max-width: 900px) { position: relative; top: 0; }
`;
const TOCCard = styled.div`
  background: #fff; border: 1px solid #eee; border-radius: 16px; overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
`;
const TOCHeader = styled.div`
  padding: 18px 20px; background: linear-gradient(135deg, ${theme.colors.textDark}, #2d2d2d);
  display: flex; align-items: center; gap: 10px;
`;
const TOCHeaderTitle = styled.span`font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.85); letter-spacing: 0.1em; text-transform: uppercase;`;
const TOCList = styled.nav`padding: 12px 0;`;
const TOCItem = styled.a<{ $active?: boolean }>`
  display: flex; align-items: center; gap: 10px; padding: 10px 20px;
  font-size: 13px; color: ${({ $active }) => $active ? theme.colors.primary : theme.colors.textDark};
  font-weight: ${({ $active }) => $active ? '700' : '400'};
  text-decoration: none; transition: all 0.15s;
  background: ${({ $active }) => $active ? theme.colors.primaryGhost : 'transparent'};
  border-left: 3px solid ${({ $active }) => $active ? theme.colors.primary : 'transparent'};
  &:hover { background: #fafafa; color: ${theme.colors.primary}; }
`;
const TOCNum = styled.span`
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
  background: ${({ color }: { color?: string }) => color || '#f0f0f0'};
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
`;

const UpdatedBadge = styled.div`
  display: inline-flex; align-items: center; gap: 8px;
  background: #f8f9fa; border: 1px solid #eee; border-radius: 20px;
  padding: 6px 14px; font-size: 12px; color: ${theme.colors.text};
  margin-bottom: 32px;
`;

// Accordion clauses
const ClauseList = styled.div`display: flex; flex-direction: column; gap: 12px;`;

const Clause = styled.div<{ $open: boolean }>`
  border: 1px solid ${({ $open }) => $open ? theme.colors.primary : '#eee'};
  border-radius: 14px; overflow: hidden; transition: border-color 0.2s;
  box-shadow: ${({ $open }) => $open ? '0 4px 20px rgba(130,174,70,0.1)' : 'none'};
  animation: ${fadeUp} 0.4s ease both;
`;

const ClauseBtn = styled.button<{ $open: boolean }>`
  width: 100%; display: flex; align-items: center; gap: 14px; padding: 20px 24px;
  background: ${({ $open }) => $open ? theme.colors.primaryGhost : '#fff'};
  border: none; cursor: pointer; font-family: ${theme.fonts.body}; text-align: left;
  transition: background 0.2s;
  &:hover { background: #fafafa; }
`;

const ClauseNum = styled.div<{ $open: boolean }>`
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  background: ${({ $open }) => $open ? theme.colors.primary : '#f0f0f0'};
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: ${({ $open }) => $open ? '#fff' : theme.colors.text};
  transition: all 0.2s;
`;

const ClauseTitle = styled.span`font-size: 15px; font-weight: 700; color: ${theme.colors.textDark}; flex: 1;`;

const ClauseBody = styled.div<{ $open: boolean }>`
  max-height: ${({ $open }) => $open ? '1000px' : '0'};
  overflow: hidden; transition: max-height 0.4s ease;
`;

const ClauseContent = styled.div`
  padding: 0 24px 28px 74px;
  font-size: 14px; color: ${theme.colors.text}; line-height: 1.9;
  p { margin-bottom: 12px; }
  ul { padding-left: 20px; margin-bottom: 12px; li { margin-bottom: 6px; } }
  @media (max-width: 600px) { padding: 0 20px 24px; }
`;

const Highlight = styled.div`
  background: ${theme.colors.primaryGhost}; border-left: 4px solid ${theme.colors.primary};
  padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 12px 0;
  font-size: 14px; color: ${theme.colors.textDark}; line-height: 1.7;
`;

const clauses = [
  {
    id: 'acceptance', num: '01', title: 'Acceptance of Terms',
    content: (
      <>
        <p>By accessing and using the Vegefoods website and services (collectively, the "Service"), you accept and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our Service.</p>
        <p>These Terms apply to all visitors, users, and others who access or use the Service, including customers, browsers, and content contributors.</p>
        <Highlight>We reserve the right to update these Terms at any time. Continued use of the Service after any changes constitutes your acceptance of the new Terms.</Highlight>
      </>
    ),
  },
  {
    id: 'account', num: '02', title: 'Account Registration',
    content: (
      <>
        <p>To access certain features, you may need to register for an account. When creating one, you agree to:</p>
        <ul>
          <li>Provide accurate, current, and complete information</li>
          <li>Keep your password secure and confidential</li>
          <li>Accept responsibility for all activity under your account</li>
          <li>Notify us immediately of any unauthorised use</li>
        </ul>
        <p>We reserve the right to suspend accounts that violate these Terms or appear compromised.</p>
      </>
    ),
  },
  {
    id: 'products', num: '03', title: 'Products & Pricing',
    content: (
      <>
        <p>All products are subject to availability. We reserve the right to discontinue any product without notice. Prices may change without prior notice.</p>
        <ul>
          <li>In the event of a pricing error, we may cancel your order and issue a full refund</li>
          <li>Promotional prices are valid only during the specified period</li>
          <li>Product images are illustrative — actual items may vary due to natural variation in fresh produce</li>
        </ul>
      </>
    ),
  },
  {
    id: 'orders', num: '04', title: 'Orders & Payment',
    content: (
      <>
        <p>Placing an order is an offer to purchase at the listed price. An order is confirmed only upon receipt of a confirmation email. We accept:</p>
        <ul>
          <li>Credit and Debit Cards (Visa, Mastercard, Amex)</li>
          <li>PayPal, Apple Pay, Google Pay</li>
          <li>Klarna, BLIK, Przelewy24</li>
          <li>Cash on Delivery (selected areas only)</li>
        </ul>
        <Highlight>Payments are processed securely via Stripe. We never store full card details. All transactions use TLS encryption.</Highlight>
      </>
    ),
  },
  {
    id: 'delivery', num: '05', title: 'Delivery',
    content: (
      <>
        <p>Delivery timeframes are estimates. Delays may occur due to weather, carrier issues, or force majeure.</p>
        <ul>
          <li>Risk of loss passes to you upon delivery</li>
          <li>You are responsible for ensuring someone is available to receive perishable orders</li>
          <li>We are not liable for losses from incorrect delivery address information</li>
        </ul>
      </>
    ),
  },
  {
    id: 'returns', num: '06', title: 'Returns & Refunds',
    content: (
      <>
        <p>Our full returns policy is detailed on our Returns & Exchange page. In summary:</p>
        <ul>
          <li>Eligible non-perishable items may be returned within 30 days</li>
          <li>Fresh produce cannot be returned unless damaged, defective, or incorrect</li>
          <li>Refunds are processed to the original payment method</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ip', num: '07', title: 'Intellectual Property',
    content: (
      <>
        <p>All content on Vegefoods — including text, graphics, logos, images, and software — is the property of Vegefoods or its content suppliers and is protected by applicable copyright and trademark laws.</p>
        <p>You may not reproduce, distribute, or create derivative works without our prior written consent.</p>
      </>
    ),
  },
  {
    id: 'liability', num: '08', title: 'Limitation of Liability',
    content: (
      <>
        <p>To the fullest extent permitted by law, Vegefoods shall not be liable for any indirect, incidental, or consequential damages from:</p>
        <ul>
          <li>Your access to or inability to use the Service</li>
          <li>Conduct or content of any third party on the Service</li>
          <li>Unauthorised access or alteration of your transmissions</li>
        </ul>
        <Highlight>Our total liability shall not exceed the total amount paid by you for the order giving rise to the claim.</Highlight>
      </>
    ),
  },
  {
    id: 'governing', num: '09', title: 'Governing Law',
    content: (
      <>
        <p>These Terms are governed by the laws of the jurisdiction in which Vegefoods is registered, without regard to conflict of law provisions.</p>
        <p>Any disputes shall be subject to the exclusive jurisdiction of the courts of that jurisdiction.</p>
      </>
    ),
  },
  {
    id: 'contact', num: '10', title: 'Contact',
    content: (
      <>
        <p>If you have questions about these Terms, contact us:</p>
        <ul>
          <li><strong>Email:</strong> legal@vegefoods.com</li>
          <li><strong>Address:</strong> 203 Fake St., Mountain View, San Francisco, CA, USA</li>
          <li><strong>Phone:</strong> +1 392 3929 210</li>
        </ul>
      </>
    ),
  },
];

const TermsPage: React.FC = () => {
  const [openId, setOpenId] = useState<string>('acceptance');
  const toggle = (id: string) => setOpenId(prev => prev === id ? '' : id);

  return (
    <PageWrap>
      <PageHero title="Terms & Conditions" breadcrumbs={[{ label: 'Terms & Conditions' }]} />
      <Section>
        <Container>
          <Layout>
            {/* Sidebar TOC */}
            <TOCSidebar>
              <TOCCard>
                <TOCHeader>
                  <FileText size={14} color="rgba(255,255,255,0.7)" />
                  <TOCHeaderTitle>Contents</TOCHeaderTitle>
                </TOCHeader>
                <TOCList>
                  {clauses.map(c => (
                    <TOCItem
                      key={c.id}
                      href={`#${c.id}`}
                      $active={openId === c.id}
                      onClick={(e) => { e.preventDefault(); setOpenId(c.id); document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
                    >
                      <TOCNum color={openId === c.id ? theme.colors.primary : undefined}
                        style={{ color: openId === c.id ? '#fff' : theme.colors.text, background: openId === c.id ? theme.colors.primary : '#f0f0f0' }}>
                        {c.num}
                      </TOCNum>
                      {c.title}
                    </TOCItem>
                  ))}
                </TOCList>
              </TOCCard>
              <div style={{ marginTop: 16, padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
                📅 Last updated: <strong>January 1, 2025.</strong><br />
                Please read carefully before using our services.
              </div>
            </TOCSidebar>

            {/* Accordion clauses */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="#fff" />
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: theme.colors.textDark, margin: 0 }}>Terms & Conditions</h1>
              </div>
              <UpdatedBadge>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.primary, display: 'inline-block' }} />
                Effective January 1, 2025
              </UpdatedBadge>

              <ClauseList>
                {clauses.map((c, i) => (
                  <Clause key={c.id} id={c.id} $open={openId === c.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <ClauseBtn $open={openId === c.id} onClick={() => toggle(c.id)}>
                      <ClauseNum $open={openId === c.id}>{c.num}</ClauseNum>
                      <ClauseTitle>{c.title}</ClauseTitle>
                      {openId === c.id ? <ChevronUp size={18} color={theme.colors.primary} /> : <ChevronDown size={18} color={theme.colors.text} />}
                    </ClauseBtn>
                    <ClauseBody $open={openId === c.id}>
                      <ClauseContent>{c.content}</ClauseContent>
                    </ClauseBody>
                  </Clause>
                ))}
              </ClauseList>
            </div>
          </Layout>
        </Container>
      </Section>
      <NewsletterSection />
    </PageWrap>
  );
};

export default TermsPage;