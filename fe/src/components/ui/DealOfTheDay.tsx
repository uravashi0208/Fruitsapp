// ============================================================
// DEAL OF THE DAY — shared useInView + animations
// ============================================================
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled, { css } from "styled-components";
import { theme } from "../../styles/theme";
import { Container } from "../../styles/shared";
import { fadeRight, countUp, gentlePulse } from "../../styles/animations";
import { useInView } from "../../hooks/useInView";

// ── Countdown hook ─────────────────────────────────────────────
const useCountdown = (daysAhead = 3) => {
  const target = new Date();
  target.setDate(target.getDate() + daysAhead);
  target.setHours(23, 59, 59);

  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return;
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return time;
};

// ── Styled ─────────────────────────────────────────────────────
const DealSection = styled.section<{ $bg: string }>`
  background-image: url(${({ $bg }) => $bg});
  background-size: cover;
  background-position: center;
  padding: 6em 0;
  position: relative;
`;

const DealAlignRight = styled.aside`
  display: flex;
  justify-content: flex-end;
`;

const DealInner = styled.article<{ $visible: boolean }>`
  max-width: 500px;
  opacity: 0;
  ${({ $visible }) =>
    $visible &&
    css`
      animation: ${fadeRight} 0.7s ease both;
      animation-delay: 100ms;
    `}
`;

const DealText = styled.header`
  .subheading {
    font-size: ${theme.fontSizes.lg};
    display: block;
    margin-bottom: 0.2rem;
    font-family: ${theme.fonts.serif};
    color: ${theme.colors.primary};
    font-style: italic;
    line-height: 1.8;
    font-weight: ${theme.fontWeights.normal};
    letter-spacing: 0.5px;
    text-transform: capitalize;
  }
  h2 {
    font-weight: ${theme.fontWeights.semibold};
    font-size: 40px;
    color: ${theme.colors.textDark};
    margin-bottom: 16px;
  }
  h3 {
    font-size: 30px;
    font-family: ${theme.fonts.serif};
    font-style: italic;
    a {
      color: ${theme.colors.primary};
      text-decoration: none;
    }
  }
  .price {
    font-weight: ${theme.fontWeights.medium};
    font-size: 18px;
    color: rgba(0, 0, 0, 0.5);
    margin-top: 8px;
    display: block;
    a {
      color: ${theme.colors.primary};
      text-decoration: none;
    }
  }
`;

const TimerBox = styled.footer`
  display: flex;
  gap: 20px;
  margin-top: 40px;
  flex-wrap: wrap;
`;

const TimeUnit = styled.figure<{ $visible: boolean; $delay: number }>`
  text-align: left;
  border-left: 1px solid rgba(0, 0, 0, 0.05);
  padding-left: 16px;
  margin: 0;
  opacity: 0;
  ${({ $visible, $delay }) =>
    $visible &&
    css`
      animation: ${countUp} 0.5s ease both;
      animation-delay: ${$delay}ms;
    `}
  .number {
    font-size: 40px;
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.primary};
    line-height: 1;
    display: block;
  }
  .label {
    font-size: 13px;
    color: ${theme.colors.text};
  }
`;

const PriceHighlight = styled.span<{ $visible: boolean }>`
  display: inline-block;
  ${({ $visible }) =>
    $visible &&
    css`
      animation: ${gentlePulse} 2s ease-in-out 1s infinite;
    `}
`;

// ── Component ──────────────────────────────────────────────────
interface Props {
  bg?: string;
  productName?: string;
  originalPrice?: string;
  dealPrice?: string;
  description?: string;
}

export const DealOfTheDay: React.FC<Props> = ({
  bg = "/images/bg_3.jpg",
  productName = "Spinach",
  originalPrice = "$10",
  dealPrice = "$5",
  description = "Fresh, organic produce at unbeatable prices — only for a limited time!",
}) => {
  const countdown = useCountdown();
  const { ref, visible } = useInView(0.2);

  return (
    <DealSection $bg={bg}>
      <Container>
        <div ref={ref}>
          <DealAlignRight>
            <DealInner $visible={visible}>
              <DealText>
                <span className="subheading">Best Price For You</span>
                <h2>Deal of the day</h2>
                <p style={{ color: theme.colors.text, marginBottom: 12 }}>
                  {description}
                </p>
                <h3>
                  <Link to="/shop">{productName}</Link>
                </h3>
                <span className="price">
                  {originalPrice}{" "}
                  <PriceHighlight $visible={visible}>
                    <Link to="/shop">now {dealPrice} only</Link>
                  </PriceHighlight>
                </span>
              </DealText>

              <TimerBox>
                {[
                  { num: countdown.days, label: "Days" },
                  { num: countdown.hours, label: "Hours" },
                  { num: countdown.minutes, label: "Minutes" },
                  { num: countdown.seconds, label: "Seconds" },
                ].map((t, i) => (
                  <TimeUnit
                    key={t.label}
                    $visible={visible}
                    $delay={300 + i * 100}
                  >
                    <span className="number">
                      {String(t.num).padStart(2, "0")}
                    </span>
                    <span className="label">{t.label}</span>
                  </TimeUnit>
                ))}
              </TimerBox>
            </DealInner>
          </DealAlignRight>
        </div>
      </Container>
    </DealSection>
  );
};
