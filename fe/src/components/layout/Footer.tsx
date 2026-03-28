import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Container } from '../../styles/shared';
import { Twitter, Facebook, Instagram, MapPin, Phone, Mail } from 'lucide-react';
import { API_BASE } from '../../api/client';

// ── Types ─────────────────────────────────────────────────────
interface SiteSettings {
  siteName?:       string;
  address?:        string;
  email?:          string;
  phone?:          string;
  twitterLink?:    string;
  facebookLink?:   string;
  instagramLink?:  string;
  aboutUs?:        string;
}

// ── Styled components ─────────────────────────────────────────
const FooterWrap = styled.footer`
  font-size: 14px;
  padding: 5em 0;
  color: ${theme.colors.textDark};
  background: white;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 1.5fr;
  gap: 80px;
  margin-bottom: 40px;
  @media (max-width: ${theme.breakpoints.lg}) { grid-template-columns: 1fr 1fr; }
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

const WidgetTitle = styled.h2`
  font-weight: ${theme.fontWeights.medium};
  margin-bottom: 20px;
  font-size: 16px;
  color: ${theme.colors.textDark};
  font-family: ${theme.fonts.body};
`;

const FooterList = styled.ul`
  li { font-size: 14px; margin-bottom: 0; }
  a {
    color: ${theme.colors.textDark};
    padding: 8px 0;
    display: block;
    transition: ${theme.transitions.base};
    &:hover { color: ${theme.colors.primary}; padding-left: 6px; }
  }
`;

const SocialList = styled.ul`
  display: flex;
  gap: 8px;
  margin-top: 3rem;
  li a {
    width: 50px; height: 50px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: ${theme.colors.textDark};
    font-size: 30px;
    transition: ${theme.transitions.base};
    text-decoration: none;
    background: rgba(0,0,0,0.02);
    &:hover { background: ${theme.colors.primary}; color: white; }
  }
`;

const ContactBlock = styled.ul`
  li {
    display: flex;
    gap: 12px;
    margin-bottom: 15px;
    font-size: 14px;
    color: ${theme.colors.dark};
  }
`;

const ContactIcon = styled.span`
  width: 40px;
  color: ${theme.colors.dark};
  font-size: 18px;
  flex-shrink: 0;
`;

const Divider = styled.div`
  border-top: 1px solid rgba(0,0,0,0.06);
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: ${theme.colors.textMuted ?? '#999'};
`;

// ── Footer Component ──────────────────────────────────────────
export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    fetch(`${API_BASE}/api/settings`)
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.success && json?.data) setSettings(json.data); })
      .catch(() => {}); // silent fail — fall back to defaults
  }, []);

  const siteName     = settings.siteName    || 'Vegefoods';
  const address      = settings.address     || '203 Fake St. Mountain View, San Francisco, California, USA';
  const phone        = settings.phone       || '+2 392 3929 210';
  const email        = settings.email       || 'info@vegefoods.com';
  const twitterUrl   = settings.twitterLink  || '#';
  const facebookUrl  = settings.facebookLink || '#';
  const instagramUrl = settings.instagramLink|| '#';
  const about        = settings.aboutUs     || 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia.';

  return (
    <FooterWrap>
      <Container>
        <FooterGrid>
          {/* Brand */}
          <div>
            <WidgetTitle>{siteName}</WidgetTitle>
            <p style={{ fontSize: 14, color: theme.colors.dark, marginBottom: 0, lineHeight: 1.7 }}>
              {about}
            </p>
            <SocialList>
              <li>
                <a href={twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter size={20} />
                </a>
              </li>
              <li>
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <Facebook size={20} />
                </a>
              </li>
              <li>
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram size={20} />
                </a>
              </li>
            </SocialList>
          </div>

          {/* Menu */}
          <div>
            <WidgetTitle>Menu</WidgetTitle>
            <FooterList>
              <li><Link to="/shop">Shop</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/blog">Journal</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </FooterList>
          </div>

          {/* Help */}
          <div>
            <WidgetTitle>Help</WidgetTitle>
            <div style={{ display: 'flex', gap: 20 }}>
              <FooterList>
                <li><span style={{cursor:"pointer"}}>Shipping Information</span></li>
                <li><span style={{cursor:"pointer"}}>Returns &amp; Exchange</span></li>
                <li><span style={{cursor:"pointer"}}>Terms &amp; Conditions</span></li>
                <li><span style={{cursor:"pointer"}}>Privacy Policy</span></li>
              </FooterList>
              <FooterList>
                <li><span><Link to="/faq">FAQs</Link></span></li>
                <li><span><Link to="/contact">Contact</Link></span></li>
              </FooterList>
            </div>
          </div>

          {/* Contact */}
          <div>
            <WidgetTitle>Have a Question?</WidgetTitle>
            <ContactBlock>
              {address && (
                <li>
                  <ContactIcon><MapPin size={18} /></ContactIcon>
                  <span>{address}</span>
                </li>
              )}
              {phone && (
                <li>
                  <ContactIcon><Phone size={18} /></ContactIcon>
                  <a href={`tel:${phone.replace(/\s/g,'')}`} style={{ color: theme.colors.textDark }}>
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <ContactIcon><Mail size={18} /></ContactIcon>
                  <a href={`mailto:${email}`} style={{ color: theme.colors.textDark }}>
                    {email}
                  </a>
                </li>
              )}
            </ContactBlock>
          </div>
        </FooterGrid>

        <Divider>
          <span>© {new Date().getFullYear()} {siteName}. All rights reserved.</span>
          <span style={{ display: 'flex', gap: 16 }}>
            <span style={{ color: 'inherit', cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ color: 'inherit', cursor: 'pointer' }}>Terms</span>
          </span>
        </Divider>
      </Container>
    </FooterWrap>
  );
};
