// ============================================================
// TESTIMONIALS SECTION — shared useInView + animations
// ============================================================
import React from "react";
import styled, { css } from "styled-components";
import { Star } from "lucide-react";
import { theme } from "../../styles/theme";
import { Container, Section } from "../../styles/shared";
import { fadeUp, fadeDown, avatarReveal } from "../../styles/animations";
import { useInView } from "../../hooks/useInView";
import { useTestimonials } from "../../hooks/useApi";
import { API_BASE } from "../../api/client";

const resolveAvatar = (avatar: string) => {
  if (!avatar) return "/images/person_1.jpg";
  if (avatar.startsWith("http") || avatar.startsWith("/images")) return avatar;
  return `${API_BASE}${avatar}`;
};

// ── Styled ─────────────────────────────────────────────────────
const HeadingSection = styled.header<{ $visible: boolean }>`
  text-align: center;
  margin-bottom: 40px;
  margin-top: 1rem;
  opacity: 0;
  ${({ $visible }) =>
    $visible &&
    css`
      animation: ${fadeDown} 0.6s ease both;
    `}
  h2 {
    font-size: ${theme.fontSizes["4xl"]};
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textDark};
    @media (max-width: ${theme.breakpoints.md}) {
      font-size: 28px;
    }
  }
  .subheading {
    font-size: ${theme.fontSizes.lg};
    display: block;
    margin-bottom: 0.4rem;
    font-family: ${theme.fonts.serif};
    color: ${theme.colors.primary};
    font-style: italic;
    line-height: 1.8;
    font-weight: ${theme.fontWeights.normal};
    letter-spacing: 1px;
    text-transform: capitalize;
  }
  p {
    max-width: 680px;
    margin: 10px auto 0;
    color: ${theme.colors.text};
  }
`;

const TestimonyGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  list-style: none;
  padding: 0;
  margin: 0;
  @media (max-width: ${theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const TestimonyCard = styled.li<{ $visible: boolean; $delay: number }>`
  background: rgba(255, 255, 255, 0.1);
  color: rgba(0, 0, 0, 0.8);
  padding: 30px 30px 40px;
  text-align: center;
  position: relative;
  opacity: 0;
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;
  ${({ $visible, $delay }) =>
    $visible &&
    css`
      animation: ${fadeUp} 0.65s ease both;
      animation-delay: ${$delay}ms;
    `}
  &:hover {
    box-shadow: 0 10px 40px rgba(130, 174, 70, 0.15);
    transform: translateY(-4px);
  }
`;

const UserImg = styled.figure<{
  $src: string;
  $visible: boolean;
  $delay: number;
}>`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-image: url(${({ $src }) => $src});
  background-size: cover;
  background-position: center;
  margin: 0 auto 20px;
  position: relative;
  opacity: 0;
  ${({ $visible, $delay }) =>
    $visible &&
    css`
      animation: ${avatarReveal} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      animation-delay: ${$delay + 200}ms;
    `}
`;

const StarsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 3px;
  margin-bottom: 14px;
`;

const TestimonyText = styled.p`
  position: relative;
  padding-left: 16px;
  border-left: 1px solid #e6e6e6;
  margin-bottom: 3rem;
  text-align: left;
  &::after {
    position: absolute;
    content: "";
    top: 50%;
    left: -2px;
    transform: translateY(-50%);
    width: 3px;
    height: 30px;
    background: ${theme.colors.primary};
  }
`;

const TestimonyName = styled.p`
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textDark};
  font-size: 14px;
  margin-bottom: 2px;
`;

const TestimonyRole = styled.span`
  font-size: 12px;
  color: ${theme.colors.text};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

// ── Skeleton ───────────────────────────────────────────────────
const SkeletonCard = styled.li`
  background: rgba(255, 255, 255, 0.1);
  padding: 30px;
  border-radius: 4px;
`;
const SkeletonCircle = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease infinite;
  margin: 0 auto 20px;
`;
const SkeletonLine = styled.div<{ $w?: string }>`
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease infinite;
  width: ${({ $w }) => $w || "100%"};
  margin: 8px auto;
`;

// ── Component ──────────────────────────────────────────────────
export const TestimonialsSection: React.FC<{ count?: number }> = ({
  count = 3,
}) => {
  const { ref, visible } = useInView(0.1);
  const { data: testimonials, loading } = useTestimonials();
  const displayItems = (testimonials ?? []).slice(0, count);

  return (
    <Section>
      <Container>
        <div ref={ref}>
          <HeadingSection $visible={visible}>
            <span className="subheading">Testimony</span>
            <h2>Our satisfied customer says</h2>
            <p>
              Real people, real results — hear what our happy customers have to
              say about us.
            </p>
          </HeadingSection>

          <TestimonyGrid>
            {loading
              ? Array.from({ length: count }).map((_, i) => (
                  <SkeletonCard key={i}>
                    <SkeletonCircle />
                    <SkeletonLine $w="60%" />
                    <SkeletonLine $w="40%" />
                    <SkeletonLine />
                    <SkeletonLine />
                    <SkeletonLine $w="80%" />
                  </SkeletonCard>
                ))
              : displayItems.map((t, i) => (
                  <TestimonyCard key={t.id} $visible={visible} $delay={i * 150}>
                    <UserImg
                      $src={resolveAvatar(t.avatar)}
                      $visible={visible}
                      $delay={i * 150}
                    ></UserImg>
                    <StarsRow>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={14}
                          fill={n <= t.rating ? "#f79009" : "none"}
                          color={n <= t.rating ? "#f79009" : "#d0d5dd"}
                        />
                      ))}
                    </StarsRow>
                    <section style={{ marginTop: 20 }}>
                      <TestimonyText>{t.message}</TestimonyText>
                      <TestimonyName>{t.name}</TestimonyName>
                      <TestimonyRole>{t.position}</TestimonyRole>
                    </section>
                  </TestimonyCard>
                ))}
          </TestimonyGrid>
        </div>
      </Container>
    </Section>
  );
};
