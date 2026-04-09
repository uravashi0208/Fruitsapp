// ============================================================
// NEWSLETTER SECTION — shared useInView + animations
// ============================================================
import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { Section } from '../../styles/shared';
import { fadeLeft, fadeRight, successPop } from '../../styles/animations';
import { useInView } from '../../hooks/useInView';
import { newsletterApi } from '../../api/storefront';
import { ApiError } from '../../api/client';

// ── Styled ─────────────────────────────────────────────────────
const NewsletterContainer = styled.section`
  width: 100%; max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  gap: 30px; flex-wrap: wrap; padding: 20px 60px;
  @media (max-width: ${theme.breakpoints.md}) { padding: 20px 15px; }
`;

const NewsletterText = styled.header<{ $visible: boolean }>`
  flex: 1; min-width: 240px; opacity: 0;
  ${({ $visible }) => $visible && css`animation: ${fadeLeft} 0.6s ease both;`}
`;

const NewsletterTitle = styled.h2`
  font-size: 22px; margin-bottom: 4px;
  font-family: ${theme.fonts.body};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textDark};
`;

const NewsletterSubtitle = styled.span`
  font-size: 13px; color: ${theme.colors.text};
`;

const FormWrap = styled.div<{ $visible: boolean }>`
  display: flex; flex: 1; min-width: 280px; max-width: 500px;
  opacity: 0; flex-direction: column; gap: 6px;
  ${({ $visible }) => $visible && css`
    animation: ${fadeRight} 0.6s ease both;
    animation-delay: 150ms;
  `}
`;

const SubscribeForm = styled.form`
  display: flex; overflow: hidden;
  border: 1px solid #dee2e6; width: 100%;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  &:focus-within {
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(130,174,70,0.12);
  }
`;

const SubscribeInput = styled.input`
  flex: 1; padding: 15px 16px; border: none;
  font-family: ${theme.fonts.body}; font-size: 13px;
  outline: none; color: ${theme.colors.textDark}; background: white;
  &::placeholder { color: rgba(0,0,0,0.3); }
`;

const SubscribeBtn = styled.button`
  padding: 10px 20px; background: ${theme.colors.primary};
  color: white; border: none; font-family: ${theme.fonts.body};
  font-size: 13px; cursor: pointer; transition: ${theme.transitions.base};
  white-space: nowrap;
  &:hover  { background: ${theme.colors.primaryDark}; }
  &:active { transform: scale(0.97); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const SuccessMsg = styled.span`
  display: inline-block; color: ${theme.colors.primary};
  font-size: 13px; font-weight: ${theme.fontWeights.medium};
  animation: ${successPop} 0.4s ease both; padding: 15px 0;
`;

const ErrorMsg = styled.span`
  font-size: 12px; color: #e53935; padding: 0 2px;
`;

// ── Component ──────────────────────────────────────────────────
interface Props { title?: string; subtitle?: string; }

export const NewsletterSection: React.FC<Props> = ({
  title    = 'Subscribe to our Newsletter',
  subtitle = 'Get e-mail updates about our latest shops and special offers',
}) => {
  const [email,      setEmail]      = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [errMsg,     setErrMsg]     = useState('');
  const { ref, visible } = useInView(0.2);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErrMsg('');
    setLoading(true);
    try {
      await newsletterApi.subscribe({ email: email.trim(), name: email.split('@')[0] });
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setSubscribed(false), 4000);
      } else {
        setErrMsg(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section $bg="#f7f6f2">
      <div ref={ref}>
        <NewsletterContainer>
          <NewsletterText $visible={visible}>
            <NewsletterTitle>{title}</NewsletterTitle>
            <NewsletterSubtitle>{subtitle}</NewsletterSubtitle>
          </NewsletterText>

          <FormWrap $visible={visible}>
            {subscribed ? (
              <SuccessMsg>🌿 Thank you! Check your inbox for a welcome email.</SuccessMsg>
            ) : (
              <>
                <SubscribeForm onSubmit={handleSubscribe}>
                  <SubscribeInput
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrMsg(''); }}
                    required
                  />
                  <SubscribeBtn type="submit" disabled={loading}>
                    {loading ? '…' : 'Subscribe'}
                  </SubscribeBtn>
                </SubscribeForm>
                {errMsg && <ErrorMsg>{errMsg}</ErrorMsg>}
              </>
            )}
          </FormWrap>
        </NewsletterContainer>
      </div>
    </Section>
  );
};
