// ============================================================
// FOOTER — upgraded: shared useInView, CSS vars, entrance anim
// ============================================================
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled, { css } from "styled-components";
import { theme } from "../../styles/theme";
import { Container } from "../../styles/shared";
import {
  Twitter,
  Facebook,
  Instagram,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { API_BASE } from "../../api/client";
import { fadeUp } from "../../styles/animations";
import { useInView } from "../../hooks/useInView";

interface SiteSettings {
  siteName?: string;
  address?: string;
  email?: string;
  phone?: string;
  twitterLink?: string;
  facebookLink?: string;
  instagramLink?: string;
  aboutUs?: string;
}

// ── Styled ─────────────────────────────────────────────────────
const FooterWrap = styled.footer`
  font-size: 14px;
  padding: 5em 0;
  color: ${theme.colors.textDark};
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
`;

const FooterGrid = styled.div<{ $visible: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 1.5fr;
  gap: 80px;
  margin-bottom: 40px;
  opacity: 0;
  ${({ $visible }) =>
    $visible &&
    css`
      animation: ${fadeUp} 0.7s ease both;
    `}
  @media (max-width: ${theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const WidgetTitle = styled.h2`
  font-weight: ${theme.fontWeights.medium};
  margin-bottom: 20px;
  font-size: 16px;
  color: ${theme.colors.textDark};
  font-family: ${theme.fonts.body};
  position: relative;
  padding-bottom: 12px;
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 30px;
    height: 2px;
    background: ${theme.colors.primary};
    border-radius: 2px;
  }
`;

const FooterList = styled.ul`
  li {
    font-size: 14px;
    margin-bottom: 0;
  }
  a {
    color: ${theme.colors.textDark};
    padding: 7px 0;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: ${theme.transitions.base};
    &::before {
      content: "›";
      color: ${theme.colors.primary};
      font-size: 16px;
      line-height: 1;
      opacity: 0;
      transform: translateX(-4px);
      transition: ${theme.transitions.base};
    }
    &:hover {
      color: ${theme.colors.primary};
      padding-left: 4px;
      &::before {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }
`;

const SocialList = styled.ul`
  display: flex;
  gap: 8px;
  margin-top: 3rem;
  li a {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${theme.colors.textDark};
    transition: ${theme.transitions.base};
    text-decoration: none;
    background: rgba(0, 0, 0, 0);
    &:hover {
      background: ${theme.colors.primary};
      color: white;
      border-color: ${theme.colors.primary};
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(130, 174, 70, 0.3);
    }
  }
`;

const ContactBlock = styled.ul`
  li {
    display: flex;
    gap: 12px;
    margin-bottom: 15px;
    font-size: 14px;
    color: ${theme.colors.dark};
    align-items: flex-start;
  }
`;

const ContactIcon = styled.span`
  color: ${theme.colors.primary};
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
`;

const FooterBottom = styled.div`
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: ${theme.colors.textMuted};
`;

const HelpLinks = styled.div`
  display: flex;
  gap: 20px;
`;

// ── Component ──────────────────────────────────────────────────
export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const { ref, visible } = useInView(0.05);

  useEffect(() => {
    fetch(`${API_BASE}/api/settings`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json?.data) setSettings(json.data);
      })
      .catch(() => {});
  }, []);

  const siteName = settings.siteName || "Vegefoods";
  const address =
    settings.address ||
    "203 Fake St. Mountain View, San Francisco, California, USA";
  const phone = settings.phone || "+2 392 3929 210";
  const email = settings.email || "info@vegefoods.com";
  const twitterUrl = settings.twitterLink || "#";
  const facebookUrl = settings.facebookLink || "#";
  const instagramUrl = settings.instagramLink || "#";
  const about =
    settings.aboutUs ||
    "Farm-fresh produce delivered straight to your door. Quality, freshness, and flavour you can taste.";

  return (
    <FooterWrap>
      <Container>
        <div ref={ref}>
          <FooterGrid $visible={visible}>
            {/* Brand */}
            <div>
              <WidgetTitle>{siteName}</WidgetTitle>
              <p
                style={{
                  fontSize: 14,
                  color: theme.colors.dark,
                  marginBottom: 0,
                  lineHeight: 1.8,
                }}
              >
                {about}
              </p>
              <SocialList>
                <li>
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                  >
                    <Twitter size={18} />
                  </a>
                </li>
                <li>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                  >
                    <Facebook size={18} />
                  </a>
                </li>
                <li>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <Instagram size={18} />
                  </a>
                </li>
              </SocialList>
            </div>

            {/* Menu */}
            <div>
              <WidgetTitle>Menu</WidgetTitle>
              <FooterList>
                <li>
                  <Link to="/shop">Shop</Link>
                </li>
                <li>
                  <Link to="/about">About</Link>
                </li>
                <li>
                  <Link to="/blog">Journal</Link>
                </li>
                <li>
                  <Link to="/contact">Contact Us</Link>
                </li>
              </FooterList>
            </div>

            {/* Help */}
            <div>
              <WidgetTitle>Help</WidgetTitle>
              <div style={{ display: "flex", gap: 20 }}>
                <FooterList>
                  <li>
                    <Link to="/shipping">Shipping Info</Link>
                  </li>
                  <li>
                    <Link to="/returns">Returns &amp; Exchange</Link>
                  </li>
                  <li>
                    <Link to="/terms">Terms &amp; Conditions</Link>
                  </li>
                  <li>
                    <Link to="/privacy">Privacy Policy</Link>
                  </li>
                </FooterList>
                <FooterList>
                  <li>
                    <Link to="/faq">FAQs</Link>
                  </li>
                  <li>
                    <Link to="/contact">Contact</Link>
                  </li>
                  <li>
                    <Link to="/account">My Account</Link>
                  </li>
                  <li>
                    <Link to="/my-orders">Track Order</Link>
                  </li>
                </FooterList>
              </div>
            </div>

            {/* Contact */}
            <div>
              <WidgetTitle>Have a Question?</WidgetTitle>
              <ContactBlock>
                {address && (
                  <li>
                    <ContactIcon>
                      <MapPin size={18} />
                    </ContactIcon>
                    <span>{address}</span>
                  </li>
                )}
                {phone && (
                  <li>
                    <ContactIcon>
                      <Phone size={18} />
                    </ContactIcon>
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      style={{ color: theme.colors.textDark }}
                    >
                      {phone}
                    </a>
                  </li>
                )}
                {email && (
                  <li>
                    <ContactIcon>
                      <Mail size={18} />
                    </ContactIcon>
                    <a
                      href={`mailto:${email}`}
                      style={{ color: theme.colors.textDark }}
                    >
                      {email}
                    </a>
                  </li>
                )}
              </ContactBlock>
            </div>
          </FooterGrid>

          <FooterBottom>
            <span>
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </span>
            <HelpLinks>
              <Link
                to="/privacy"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Terms
              </Link>
            </HelpLinks>
          </FooterBottom>
        </div>
      </Container>
    </FooterWrap>
  );
};
