import React from 'react';
import styled from 'styled-components';
import { Truck, Clock, MapPin, Package, Shield } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { Container, Section } from '../styles/shared';
import { theme } from '../styles/theme';

const PageWrap = styled.main`font-family: ${theme.fonts.body};`;

const Grid2 = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 48px;
  @media (max-width: ${theme.breakpoints.md}) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 32px;
  transition: box-shadow 0.25s;
  &:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.07); }
`;

const IconCircle = styled.div`
  width: 56px; height: 56px; border-radius: 50%;
  background: ${theme.colors.primaryGhost};
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 18px;
  svg { color: ${theme.colors.primary}; }
`;

const CardTitle = styled.h3`
  font-size: 17px; font-weight: 600; color: ${theme.colors.textDark}; margin-bottom: 10px;
`;

const CardText = styled.p`
  font-size: 14px; color: ${theme.colors.text}; line-height: 1.8; margin: 0;
`;

const SectionTitle = styled.h2`
  font-size: 26px; font-weight: 700; color: ${theme.colors.textDark};
  margin-bottom: 8px; font-family: ${theme.fonts.body};
`;

const SectionSub = styled.p`
  font-size: 15px; color: ${theme.colors.text}; margin-bottom: 36px; line-height: 1.7;
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; margin-bottom: 48px; font-size: 14px;
`;

const TH = styled.th`
  background: ${theme.colors.primary}; color: #fff;
  padding: 14px 20px; text-align: left; font-weight: 600; font-size: 13px;
  &:first-child { border-radius: 8px 0 0 0; }
  &:last-child  { border-radius: 0 8px 0 0; }
`;

const TD = styled.td`
  padding: 13px 20px; border-bottom: 1px solid #f0f0f0; color: ${theme.colors.textDark};
  vertical-align: middle;
`;

const TR = styled.tr`
  &:nth-child(even) td { background: #fafafa; }
  &:last-child td { border-bottom: none; }
`;

const Notice = styled.div`
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px 24px;
  margin-bottom: 48px; display: flex; gap: 14px; align-items: flex-start;
`;

const NoticeText = styled.p`font-size: 14px; color: #166534; line-height: 1.7; margin: 0;`;

export const ShippingPage: React.FC = () => (
  <PageWrap>
    <PageHero title="Shipping Information" breadcrumbs={[{ label: 'Shipping Information' }]} />

    <Section>
      <Container>
        <Notice>
          <Shield size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
          <NoticeText>
            <strong>Free shipping on all orders over $100.</strong> We partner with trusted couriers to deliver
            your fresh organic produce safely and on time, straight to your door.
          </NoticeText>
        </Notice>

        <SectionTitle>How We Ship</SectionTitle>
        <SectionSub>
          Every order is carefully packed in insulated, eco-friendly packaging to keep your
          fruits and vegetables fresh throughout transit.
        </SectionSub>

        <Grid2>
          <Card>
            <IconCircle><Truck size={24} /></IconCircle>
            <CardTitle>Standard Delivery</CardTitle>
            <CardText>
              Delivered within 3–5 business days. Available for all orders. Our standard service
              uses temperature-controlled vehicles to preserve freshness.
            </CardText>
          </Card>
          <Card>
            <IconCircle><Clock size={24} /></IconCircle>
            <CardTitle>Express Delivery</CardTitle>
            <CardText>
              Next-day delivery available for orders placed before 12:00 PM. Perfect when you
              need your groceries fast, without compromising on quality.
            </CardText>
          </Card>
          <Card>
            <IconCircle><Package size={24} /></IconCircle>
            <CardTitle>Eco Packaging</CardTitle>
            <CardText>
              All items are packed in 100% recyclable, biodegradable packaging. Our insulated
              boxes keep produce at optimal temperature for up to 24 hours.
            </CardText>
          </Card>
          <Card>
            <IconCircle><MapPin size={24} /></IconCircle>
            <CardTitle>Order Tracking</CardTitle>
            <CardText>
              Once dispatched, you'll receive a tracking link via email. Monitor your delivery
              in real-time and know exactly when your order will arrive.
            </CardText>
          </Card>
        </Grid2>

        <SectionTitle>Shipping Rates</SectionTitle>
        <SectionSub>Simple, transparent pricing — no hidden fees.</SectionSub>

        <Table>
          <thead>
            <tr>
              <TH>Order Value</TH>
              <TH>Standard (3–5 days)</TH>
              <TH>Express (Next Day)</TH>
              <TH>Estimated Delivery</TH>
            </tr>
          </thead>
          <tbody>
            <TR><TD>Under $50</TD><TD>$9.99</TD><TD>$19.99</TD><TD>Mon – Sat</TD></TR>
            <TR><TD>$50 – $99.99</TD><TD>$4.99</TD><TD>$14.99</TD><TD>Mon – Sat</TD></TR>
            <TR><TD>$100 and above</TD><TD><strong style={{color: theme.colors.primary}}>FREE</strong></TD><TD>$9.99</TD><TD>Mon – Sat</TD></TR>
          </tbody>
        </Table>

        <SectionTitle>Delivery Areas</SectionTitle>
        <SectionSub>
          We currently deliver to all major cities and surrounding areas. Remote or rural locations
          may require an additional 1–2 business days.
        </SectionSub>

        <Grid2 style={{ marginBottom: 48 }}>
          {['United States (contiguous 48 states)', 'Canada (major cities)', 'United Kingdom', 'Australia (metro areas)', 'Germany', 'France', 'Netherlands', 'Poland'].map(area => (
            <div key={area} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ color: theme.colors.primary, fontSize: 18 }}>✓</span>
              <span style={{ fontSize: 14, color: theme.colors.textDark }}>{area}</span>
            </div>
          ))}
        </Grid2>
      </Container>
    </Section>

    <NewsletterSection />
  </PageWrap>
);

export default ShippingPage;
