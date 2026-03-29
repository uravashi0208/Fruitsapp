import React from 'react';
import styled from 'styled-components';
import { FileText } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { Container, Section } from '../styles/shared';
import { theme } from '../styles/theme';

const PageWrap = styled.main`font-family: ${theme.fonts.body};`;

const LastUpdated = styled.p`
  font-size: 13px; color: ${theme.colors.textLight}; margin-bottom: 36px;
  padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;
`;

const TOC = styled.nav`
  background: #fafafa; border: 1px solid #f0f0f0; border-radius: 10px;
  padding: 24px 28px; margin-bottom: 48px;
`;

const TOCTitle = styled.h3`
  font-size: 14px; font-weight: 700; color: ${theme.colors.textDark};
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;
`;

const TOCList = styled.ol`
  margin: 0; padding-left: 20px;
  li { font-size: 14px; margin-bottom: 6px; }
  a { color: ${theme.colors.primary}; text-decoration: none; &:hover { text-decoration: underline; } }
`;

const ClauseBlock = styled.div`
  margin-bottom: 40px; scroll-margin-top: 80px;
`;

const ClauseTitle = styled.h2`
  font-size: 20px; font-weight: 700; color: ${theme.colors.textDark};
  margin-bottom: 14px; display: flex; align-items: center; gap: 10px;
  &::before {
    content: '';
    display: inline-block; width: 4px; height: 22px;
    background: ${theme.colors.primary}; border-radius: 2px; flex-shrink: 0;
  }
`;

const ClauseText = styled.div`
  font-size: 14px; color: ${theme.colors.text}; line-height: 1.9;
  p { margin-bottom: 12px; }
  ul { padding-left: 20px; margin-bottom: 12px; li { margin-bottom: 6px; } }
`;

const Highlight = styled.div`
  background: ${theme.colors.primaryGhost}; border-left: 4px solid ${theme.colors.primary};
  padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 14px;
  color: ${theme.colors.textDark}; line-height: 1.7;
`;

const clauses = [
  {
    id: 'acceptance', title: '1. Acceptance of Terms',
    content: (
      <>
        <p>By accessing and using the Vegefoods website and services (collectively, the "Service"), you accept and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use our Service.</p>
        <p>These Terms apply to all visitors, users, and others who access or use the Service, including customers, browsers, and contributors of content.</p>
        <Highlight>We reserve the right to update or change these Terms at any time. Continued use of the Service after any changes constitutes your acceptance of the new Terms.</Highlight>
      </>
    ),
  },
  {
    id: 'account', title: '2. Account Registration',
    content: (
      <>
        <p>To access certain features of our Service, you may be required to register for an account. When creating an account, you agree to:</p>
        <ul>
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and update your information to keep it accurate</li>
          <li>Keep your password secure and confidential</li>
          <li>Accept responsibility for all activity under your account</li>
          <li>Notify us immediately of any unauthorised use of your account</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these Terms or that we believe have been compromised.</p>
      </>
    ),
  },
  {
    id: 'products', title: '3. Products & Pricing',
    content: (
      <>
        <p>All products listed on Vegefoods are subject to availability. We reserve the right to discontinue any product at any time without notice.</p>
        <p>Prices are displayed in the currency applicable to your region and are subject to change without prior notice. We make every effort to ensure pricing accuracy, however:</p>
        <ul>
          <li>In the event of a pricing error, we reserve the right to cancel your order and issue a full refund</li>
          <li>Promotional prices are valid only during the specified promotional period</li>
          <li>All prices are inclusive of applicable taxes unless stated otherwise</li>
        </ul>
        <p>Product images are for illustrative purposes. Actual products may vary slightly due to natural variation in fresh produce.</p>
      </>
    ),
  },
  {
    id: 'orders', title: '4. Orders & Payment',
    content: (
      <>
        <p>When you place an order, you are making an offer to purchase the selected products at the listed price. We reserve the right to accept or decline any order.</p>
        <p>An order is confirmed only upon receipt of a confirmation email from us. We accept the following payment methods:</p>
        <ul>
          <li>Credit and Debit Cards (Visa, Mastercard, Amex)</li>
          <li>PayPal, Apple Pay, Google Pay</li>
          <li>Klarna, BLIK, Przelewy24</li>
          <li>Cash on Delivery (selected areas only)</li>
        </ul>
        <Highlight>Payment is processed securely via Stripe. We do not store full card details on our servers. All transactions are encrypted using TLS technology.</Highlight>
        <p>In the event of a failed payment, your order will not be processed. Please contact your bank or try an alternative payment method.</p>
      </>
    ),
  },
  {
    id: 'delivery', title: '5. Delivery',
    content: (
      <>
        <p>Delivery timeframes are estimates and not guaranteed. While we strive to meet all delivery commitments, delays may occur due to circumstances beyond our control including but not limited to adverse weather, carrier delays, or force majeure events.</p>
        <ul>
          <li>Risk of loss and title for products pass to you upon delivery</li>
          <li>You are responsible for ensuring someone is available to receive perishable orders</li>
          <li>We are not liable for losses resulting from incorrect delivery address information</li>
        </ul>
      </>
    ),
  },
  {
    id: 'returns', title: '6. Returns & Refunds',
    content: (
      <>
        <p>Our returns policy forms part of these Terms. Please refer to our dedicated Returns & Exchange page for full details. In summary:</p>
        <ul>
          <li>Eligible non-perishable items may be returned within 30 days of delivery</li>
          <li>Fresh produce cannot be returned unless damaged, defective, or incorrect</li>
          <li>Refunds are processed to the original payment method</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ip', title: '7. Intellectual Property',
    content: (
      <>
        <p>All content on the Vegefoods website, including but not limited to text, graphics, logos, images, product descriptions, and software, is the property of Vegefoods or its content suppliers and is protected by applicable copyright and trademark laws.</p>
        <p>You may not reproduce, distribute, modify, or create derivative works without our prior written consent.</p>
      </>
    ),
  },
  {
    id: 'liability', title: '8. Limitation of Liability',
    content: (
      <>
        <p>To the fullest extent permitted by law, Vegefoods shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, resulting from:</p>
        <ul>
          <li>Your access to or use of (or inability to access or use) the Service</li>
          <li>Any conduct or content of any third party on the Service</li>
          <li>Unauthorised access, use, or alteration of your transmissions or content</li>
        </ul>
        <Highlight>Our total liability to you for any claim arising from your use of the Service shall not exceed the total amount paid by you for the order giving rise to the claim.</Highlight>
      </>
    ),
  },
  {
    id: 'governing', title: '9. Governing Law',
    content: (
      <>
        <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Vegefoods is registered, without regard to its conflict of law provisions.</p>
        <p>Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of that jurisdiction.</p>
      </>
    ),
  },
  {
    id: 'contact', title: '10. Contact',
    content: (
      <>
        <p>If you have questions about these Terms and Conditions, please contact us:</p>
        <ul>
          <li><strong>Email:</strong> legal@vegefoods.com</li>
          <li><strong>Address:</strong> 203 Fake St., Mountain View, San Francisco, CA, USA</li>
          <li><strong>Phone:</strong> +1 392 3929 210</li>
        </ul>
      </>
    ),
  },
];

export const TermsPage: React.FC = () => (
  <PageWrap>
    <PageHero title="Terms & Conditions" breadcrumbs={[{ label: 'Terms & Conditions' }]} />

    <Section>
      <Container style={{ maxWidth: 860 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <FileText size={28} color={theme.colors.primary} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textDark, margin: 0 }}>
            Terms & Conditions
          </h1>
        </div>
        <LastUpdated>Last updated: January 1, 2025. Please read these terms carefully before using our services.</LastUpdated>

        <TOC>
          <TOCTitle>Table of Contents</TOCTitle>
          <TOCList>
            {clauses.map(c => (
              <li key={c.id}><a href={`#${c.id}`}>{c.title}</a></li>
            ))}
          </TOCList>
        </TOC>

        {clauses.map(c => (
          <ClauseBlock key={c.id} id={c.id}>
            <ClauseTitle>{c.title}</ClauseTitle>
            <ClauseText>{c.content}</ClauseText>
          </ClauseBlock>
        ))}
      </Container>
    </Section>

    <NewsletterSection />
  </PageWrap>
);

export default TermsPage;
