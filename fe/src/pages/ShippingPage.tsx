import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Truck, Clock, Package, Shield, Leaf, CheckCircle, Zap } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { Container, Section } from '../styles/shared';
import { theme } from '../styles/theme';

const fadeUp = keyframes`from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); }`;
const shimmer = keyframes`0%{background-position:200% center} 100%{background-position:-200% center}`;

const PageWrap = styled.main`font-family: ${theme.fonts.body};`;

const BannerWrap = styled.div`
  background: linear-gradient(135deg, #1a2e0a 0%, #2d4f12 50%, #1a2e0a 100%);
  padding: 56px 0 48px; position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(130,174,70,0.15) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 30%, rgba(130,174,70,0.10) 0%, transparent 50%);
  }
`;
const BannerInner = styled.div`
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 32px;
`;
const BannerLeft = styled.div`flex: 1; min-width: 260px;`;
const BannerTag = styled.span`
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(130,174,70,0.2); border: 1px solid rgba(130,174,70,0.4);
  color: #a8cc70; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 5px 14px; border-radius: 20px; margin-bottom: 16px;
`;
const BannerTitle = styled.h2`
  font-size: clamp(26px,4vw,38px); font-weight: 800; color: #fff;
  line-height: 1.2; margin-bottom: 12px; letter-spacing: -0.5px;
`;
const BannerSub = styled.p`font-size: 15px; color: rgba(255,255,255,0.7); line-height: 1.7; max-width: 440px;`;
const BannerStats = styled.div`display: flex; gap: 32px; flex-wrap: wrap;`;
const StatItem = styled.div`text-align: center;`;
const StatNum = styled.div`
  font-size: 28px; font-weight: 800;
  background: linear-gradient(90deg, #82ae46, #a8cc70, #82ae46); background-size: 200%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  animation: ${shimmer} 3s linear infinite;
`;
const StatLabel = styled.div`font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 2px; font-weight: 500;`;

const MethodGrid = styled.div`
  display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-bottom: 60px;
  @media (max-width: 900px) { grid-template-columns: repeat(2,1fr); }
  @media (max-width: 540px) { grid-template-columns: 1fr; }
`;
const MethodCard = styled.div<{ $featured?: boolean }>`
  background: ${({ $featured }) => $featured ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})` : '#fff'};
  border: 1px solid ${({ $featured }) => $featured ? 'transparent' : '#eee'};
  border-radius: 16px; padding: 28px 24px; position: relative; overflow: hidden;
  box-shadow: ${({ $featured }) => $featured ? '0 12px 40px rgba(130,174,70,0.3)' : '0 2px 12px rgba(0,0,0,0.04)'};
  transition: transform 0.25s, box-shadow 0.25s;
  animation: ${fadeUp} 0.5s ease both;
  &:hover { transform: translateY(-4px); box-shadow: ${({ $featured }) => $featured ? '0 20px 48px rgba(130,174,70,0.4)' : '0 12px 32px rgba(0,0,0,0.08)'}; }
`;
const MethodIcon = styled.div<{ $featured?: boolean }>`
  width: 48px; height: 48px; border-radius: 12px;
  background: ${({ $featured }) => $featured ? 'rgba(255,255,255,0.2)' : theme.colors.primaryGhost};
  display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
  svg { color: ${({ $featured }) => $featured ? '#fff' : theme.colors.primary}; }
`;
const MethodTitle = styled.h3<{ $featured?: boolean }>`
  font-size: 15px; font-weight: 700; margin-bottom: 8px;
  color: ${({ $featured }) => $featured ? '#fff' : theme.colors.textDark};
`;
const MethodDesc = styled.p<{ $featured?: boolean }>`
  font-size: 13px; line-height: 1.7; margin: 0;
  color: ${({ $featured }) => $featured ? 'rgba(255,255,255,0.8)' : theme.colors.text};
`;
const MethodPrice = styled.div<{ $featured?: boolean }>`
  margin-top: 16px; padding-top: 14px;
  border-top: 1px solid ${({ $featured }) => $featured ? 'rgba(255,255,255,0.2)' : '#f0f0f0'};
  font-size: 18px; font-weight: 800;
  color: ${({ $featured }) => $featured ? '#fff' : theme.colors.primary};
  span { font-size: 12px; font-weight: 400; color: ${({ $featured }) => $featured ? 'rgba(255,255,255,0.6)' : theme.colors.text}; margin-left: 4px; }
`;

const SectionHead = styled.div`margin-bottom: 36px;`;
const Label = styled.span`
  display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
  color: ${theme.colors.primary}; margin-bottom: 10px;
`;
const STitle = styled.h2`font-size: clamp(22px,3vw,30px); font-weight: 800; color: ${theme.colors.textDark}; line-height: 1.25; margin-bottom: 10px;`;
const SSub = styled.p`font-size: 15px; color: ${theme.colors.text}; line-height: 1.7;`;

const RatesWrap = styled.div`border-radius: 16px; overflow: hidden; border: 1px solid #eee; margin-bottom: 60px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);`;
const RatesHead = styled.div`display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; background: linear-gradient(135deg, ${theme.colors.textDark}, #2d2d2d); padding: 16px 24px;`;
const RatesHeadCell = styled.div`font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.8); letter-spacing: 0.08em; text-transform: uppercase;`;
const RatesRow = styled.div<{ $highlight?: boolean }>`
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 18px 24px; align-items: center;
  background: ${({ $highlight }) => $highlight ? 'rgba(130,174,70,0.04)' : '#fff'};
  border-bottom: 1px solid #f5f5f5;
  border-left: ${({ $highlight }) => $highlight ? `3px solid ${theme.colors.primary}` : '3px solid transparent'};
  &:last-child { border-bottom: none; }
`;
const RatesCell = styled.div`font-size: 14px; color: ${theme.colors.textDark};`;
const FreeBadge = styled.span`
  display: inline-flex; align-items: center; gap: 4px;
  background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0;
  font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
`;

const ProcessWrap = styled.div`
  display: grid; grid-template-columns: repeat(4,1fr); gap: 0; margin-bottom: 60px; position: relative;
  &::before {
    content: ''; position: absolute; top: 28px; left: 12.5%; right: 12.5%; height: 2px;
    background: linear-gradient(90deg, ${theme.colors.primary}, #a8cc70); z-index: 0;
  }
  @media (max-width: 700px) { grid-template-columns: 1fr 1fr; &::before { display: none; } }
`;
const ProcessStep = styled.div`text-align: center; padding: 0 12px; position: relative; z-index: 1;`;
const StepCircle = styled.div`
  width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 16px;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark});
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 800; color: #fff;
  box-shadow: 0 4px 16px rgba(130,174,70,0.35);
`;
const StepTitle = styled.h4`font-size: 13px; font-weight: 700; color: ${theme.colors.textDark}; margin-bottom: 6px;`;
const StepText  = styled.p`font-size: 12px; color: ${theme.colors.text}; line-height: 1.6; margin: 0;`;

const AreasGrid = styled.div`
  display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 60px;
  @media (max-width: 800px) { grid-template-columns: repeat(2,1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;
const AreaChip = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 14px 18px;
  background: #fff; border: 1px solid #eee; border-radius: 10px; transition: all 0.2s;
  &:hover { border-color: ${theme.colors.primary}; background: ${theme.colors.primaryGhost}; transform: translateX(3px); }
`;
const CheckDot = styled.div`
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  background: ${theme.colors.primaryGhost}; border: 1px solid rgba(130,174,70,0.3);
  display: flex; align-items: center; justify-content: center;
`;
const AreaName = styled.span`font-size: 13px; font-weight: 500; color: ${theme.colors.textDark};`;

const NoticeBar = styled.div`
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1px solid #bbf7d0; border-radius: 14px; padding: 22px 28px; margin-bottom: 48px;
`;
const NoticeIcon = styled.div`
  width: 44px; height: 44px; border-radius: 12px;
  background: #16a34a; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;

const ShippingPage: React.FC = () => (
  <PageWrap>
    <PageHero title="Shipping Information" breadcrumbs={[{ label: 'Shipping Information' }]} />

    <BannerWrap>
      <Container>
        <BannerInner>
          <BannerLeft>
            <BannerTag><Leaf size={12} /> Eco-Friendly Delivery</BannerTag>
            <BannerTitle>Fresh to your door,<br />every single time</BannerTitle>
            <BannerSub>Temperature-controlled packaging keeps your organic produce at peak freshness from our farm partners all the way to your kitchen.</BannerSub>
          </BannerLeft>
          <BannerStats>
            {[
              { num: '3–5', label: 'Day standard delivery' },
              { num: '100%', label: 'Recyclable packaging' },
              { num: '$100+', label: 'Orders ship free' },
              { num: '24h', label: 'Freshness guaranteed' },
            ].map(s => (
              <StatItem key={s.label}>
                <StatNum>{s.num}</StatNum>
                <StatLabel>{s.label}</StatLabel>
              </StatItem>
            ))}
          </BannerStats>
        </BannerInner>
      </Container>
    </BannerWrap>

    <Section>
      <Container>
        <NoticeBar>
          <NoticeIcon><Shield size={20} color="#fff" /></NoticeIcon>
          <div>
            <div style={{ fontWeight: 700, color: '#166534', fontSize: 15, marginBottom: 3 }}>Free shipping on all orders over $100</div>
            <div style={{ fontSize: 13, color: '#166534', opacity: 0.85, lineHeight: 1.6 }}>
              We partner with trusted couriers to deliver your fresh organic produce safely. All orders are insured and traceable from dispatch to doorstep.
            </div>
          </div>
        </NoticeBar>

        <SectionHead>
          <Label>Delivery Options</Label>
          <STitle>Choose how you receive it</STitle>
          <SSub>Every method comes with real-time tracking and eco-conscious packaging.</SSub>
        </SectionHead>

        <MethodGrid>
          {[
            { icon: <Truck size={22} />, title: 'Standard Delivery', featured: false, desc: 'Delivered within 3–5 business days. Temperature-controlled vehicles preserve freshness on every route.', price: '$4.99', priceNote: 'or free over $100' },
            { icon: <Zap size={22} />, title: 'Express Delivery', featured: true, desc: 'Next-day delivery for orders placed before 12 PM. Fast, without compromising quality.', price: '$9.99', priceNote: 'next business day' },
            { icon: <Clock size={22} />, title: 'Scheduled Delivery', featured: false, desc: 'Pick your preferred delivery date and 2-hour window. Perfect for busy households.', price: '$6.99', priceNote: 'choose your slot' },
            { icon: <Package size={22} />, title: 'Click & Collect', featured: false, desc: 'Pick up from 200+ partner locations. Ready within 2 hours of placing your order.', price: 'FREE', priceNote: 'always free' },
          ].map((m, i) => (
            <MethodCard key={m.title} $featured={m.featured} style={{ animationDelay: `${i * 0.08}s` }}>
              <MethodIcon $featured={m.featured}>{m.icon}</MethodIcon>
              <MethodTitle $featured={m.featured}>{m.title}</MethodTitle>
              <MethodDesc $featured={m.featured}>{m.desc}</MethodDesc>
              <MethodPrice $featured={m.featured}>{m.price}<span>{m.priceNote}</span></MethodPrice>
            </MethodCard>
          ))}
        </MethodGrid>

        <SectionHead>
          <Label>Pricing</Label>
          <STitle>Simple, transparent rates</STitle>
          <SSub>No hidden fees. What you see is what you pay.</SSub>
        </SectionHead>

        <RatesWrap>
          <RatesHead>
            <RatesHeadCell>Order Value</RatesHeadCell>
            <RatesHeadCell>Standard</RatesHeadCell>
            <RatesHeadCell>Express</RatesHeadCell>
            <RatesHeadCell>Delivery Days</RatesHeadCell>
          </RatesHead>
          {[
            { range: 'Under $50',      std: '$9.99',  exp: '$19.99', days: '3–5 business days', highlight: false },
            { range: '$50 – $99.99',   std: '$4.99',  exp: '$14.99', days: '3–5 business days', highlight: false },
            { range: '$100 and above', std: null,     exp: '$9.99',  days: '3–5 business days', highlight: true  },
          ].map(row => (
            <RatesRow key={row.range} $highlight={row.highlight}>
              <RatesCell style={{ fontWeight: row.highlight ? 700 : 400 }}>{row.range}</RatesCell>
              <RatesCell>{row.std === null ? <FreeBadge><CheckCircle size={11} /> FREE</FreeBadge> : row.std}</RatesCell>
              <RatesCell>{row.exp}</RatesCell>
              <RatesCell style={{ color: theme.colors.text, fontSize: 13 }}>{row.days}</RatesCell>
            </RatesRow>
          ))}
        </RatesWrap>

        <SectionHead>
          <Label>The Process</Label>
          <STitle>From farm to your front door</STitle>
        </SectionHead>

        <ProcessWrap>
          {[
            { n: 1, title: 'Order placed', text: 'Confirmed immediately via email' },
            { n: 2, title: 'Hand-picked', text: 'Fresh from certified organic farms' },
            { n: 3, title: 'Dispatched', text: 'Tracking link sent instantly' },
            { n: 4, title: 'Delivered', text: 'Signature or safe-place drop' },
          ].map(s => (
            <ProcessStep key={s.n}>
              <StepCircle>{s.n}</StepCircle>
              <StepTitle>{s.title}</StepTitle>
              <StepText>{s.text}</StepText>
            </ProcessStep>
          ))}
        </ProcessWrap>

        <SectionHead>
          <Label>Coverage</Label>
          <STitle>Where we deliver</STitle>
          <SSub>Currently serving 8 countries across North America, Europe, and Oceania.</SSub>
        </SectionHead>

        <AreasGrid>
          {['United States (contiguous 48 states)', 'Canada (major cities)', 'United Kingdom', 'Australia (metro areas)', 'Germany', 'France', 'Netherlands', 'Poland'].map(area => (
            <AreaChip key={area}>
              <CheckDot><CheckCircle size={13} color={theme.colors.primary} /></CheckDot>
              <AreaName>{area}</AreaName>
            </AreaChip>
          ))}
        </AreasGrid>

        <div style={{ background: 'linear-gradient(135deg, #f7f6f2, #f0f8e8)', border: '1px solid rgba(130,174,70,0.2)', borderRadius: 16, padding: '32px 36px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 48 }}>🌿</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: theme.colors.textDark, marginBottom: 8 }}>100% Eco-Conscious Packaging</div>
            <p style={{ fontSize: 14, color: theme.colors.text, lineHeight: 1.7, margin: 0 }}>Our insulated boxes are made from recycled materials and keep produce at optimal temperature for up to 24 hours. All packaging is fully recyclable and biodegradable.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
            {['Carbon neutral', 'Recyclable boxes', 'Biodegradable ice packs', 'Compostable liners'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.colors.textDark }}>
                <CheckCircle size={14} color={theme.colors.primary} /> {f}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
    <NewsletterSection />
  </PageWrap>
);

export default ShippingPage;