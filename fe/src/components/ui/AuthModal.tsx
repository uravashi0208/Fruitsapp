/**
 * src/components/ui/AuthModal.tsx
 *
 * Slide-in Login / Register modal for storefront.
 * - Guest user: "Login" button in navbar opens this modal
 * - After success: JWT saved, user state updated, modal closes
 * - No separate /login page needed — stays on current page
 */
import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { X, Eye, EyeOff, Loader, User, Lock, Mail, Phone } from 'lucide-react';
import { theme } from '../../styles/theme';
import { useAppDispatch } from '../../store';
import { showToast } from '../../store/uiSlice';
import { setTokens } from '../../api/client';
import { API_BASE } from '../../api/client';

// ─── Types ────────────────────────────────────────────────────
export type AuthMode = 'login' | 'register';

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface Props {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

// ─── Animations ───────────────────────────────────────────────
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); }`;

// ─── Styled ───────────────────────────────────────────────────
const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: ${fadeIn} 0.2s ease;
  ${({ $open }) => !$open && css`display: none;`}
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 440px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: ${slideUp} 0.25s ease;
`;

const Header = styled.div`
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  padding: 28px 28px 24px;
  position: relative;
  color: white;
  text-align: center;
`;

const Logo = styled.div`
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  opacity: 0.85;
  margin: 0;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.35); }
`;

const TabRow = styled.div`
  display: flex;
  border-bottom: 2px solid ${theme.colors.border};
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 14px;
  font-size: 14px;
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  color: ${({ $active }) => $active ? theme.colors.primary : theme.colors.text};
  border: none;
  background: white;
  border-bottom: 2px solid ${({ $active }) => $active ? theme.colors.primary : 'transparent'};
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: ${theme.fonts.body};
  &:hover { color: ${theme.colors.primary}; }
`;

const Body = styled.div`
  padding: 28px;
`;

const Field = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textDark};
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InputWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.span`
  position: absolute;
  left: 12px;
  color: ${theme.colors.text};
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 11px 40px 11px 38px;
  border: 1.5px solid ${({ $hasError }) => $hasError ? '#dc2626' : theme.colors.borderMid};
  border-radius: 6px;
  font-size: 14px;
  font-family: ${theme.fonts.body};
  outline: none;
  transition: border-color 0.2s;
  background: white;
  &:focus { border-color: ${theme.colors.primary}; }
  &::placeholder { color: ${theme.colors.textLight}; }
`;

const ToggleEye = styled.button`
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${theme.colors.text};
  display: flex;
  align-items: center;
  padding: 4px;
  &:hover { color: ${theme.colors.textDark}; }
`;

const ErrorMsg = styled.p`
  color: #dc2626;
  font-size: 11px;
  margin-top: 4px;
`;

const SubmitBtn = styled.button<{ $loading?: boolean }>`
  width: 100%;
  padding: 13px;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  font-family: ${theme.fonts.body};
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  opacity: ${({ $loading }) => $loading ? 0.75 : 1};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  &:hover:not(:disabled) { background: ${theme.colors.primaryDark}; }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  color: ${theme.colors.text};
  font-size: 12px;
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${theme.colors.border};
  }
`;

const SwitchLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-weight: 600;
  cursor: pointer;
  font-family: ${theme.fonts.body};
  font-size: 13px;
  text-decoration: underline;
  &:hover { color: ${theme.colors.primaryDark}; }
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const BenefitItem = styled.li`
  font-size: 12px;
  color: ${theme.colors.text};
  display: flex;
  align-items: center;
  gap: 6px;
  &::before {
    content: '✓';
    color: ${theme.colors.primary};
    font-weight: 700;
    font-size: 11px;
  }
`;

// ─── API calls ────────────────────────────────────────────────
async function apiAuth(endpoint: string, body: object): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
  const res = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Something went wrong');
  return json.data ?? json;
}

// ─── Component ────────────────────────────────────────────────
const AuthModal: React.FC<Props> = ({ isOpen, initialMode = 'login', onClose, onSuccess }) => {
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  useEffect(() => {
    if (isOpen) { setMode(initialMode); setErrors({}); setForm({ name: '', email: '', phone: '', password: '' }); }
  }, [isOpen, initialMode]);

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (mode === 'register' && !form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    if (!form.password || form.password.length < 6) errs.password = 'Min 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, phone: form.phone, password: form.password };

      const result = await apiAuth(mode, payload);
      setTokens(result.accessToken, result.refreshToken);
      dispatch(showToast({ message: mode === 'login' ? `Welcome back, ${result.user.name?.split(' ')[0]}!` : `Account created! Welcome, ${result.user.name?.split(' ')[0]}!`, type: 'success' }));
      onSuccess(result.user);
      onClose();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Authentication failed', type: 'error' }));
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(er => ({ ...er, [k]: '' }));
  };

  return (
    <Overlay $open={isOpen} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Modal>
        <Header>
          <CloseBtn onClick={onClose}><X size={15} /></CloseBtn>
          <Logo>🌿 Vegefoods</Logo>
          <Subtitle>{mode === 'login' ? 'Sign in to your account' : 'Create a free account'}</Subtitle>
        </Header>

        <TabRow>
          <Tab $active={mode === 'login'} onClick={() => { setMode('login'); setErrors({}); }}>Sign In</Tab>
          <Tab $active={mode === 'register'} onClick={() => { setMode('register'); setErrors({}); }}>Create Account</Tab>
        </TabRow>

        <Body>
          {errors.form && <ErrorMsg style={{ marginBottom: 12, textAlign: 'center', fontSize: 13 }}>{errors.form}</ErrorMsg>}

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <Field>
                <Label>Full Name</Label>
                <InputWrap>
                  <InputIcon><User size={15} /></InputIcon>
                  <StyledInput placeholder="Your full name" value={form.name} onChange={set('name')} $hasError={!!errors.name} />
                </InputWrap>
                {errors.name && <ErrorMsg>{errors.name}</ErrorMsg>}
              </Field>
            )}

            <Field>
              <Label>Email Address</Label>
              <InputWrap>
                <InputIcon><Mail size={15} /></InputIcon>
                <StyledInput type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} $hasError={!!errors.email} />
              </InputWrap>
              {errors.email && <ErrorMsg>{errors.email}</ErrorMsg>}
            </Field>

            {mode === 'register' && (
              <Field>
                <Label>Phone <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></Label>
                <InputWrap>
                  <InputIcon><Phone size={15} /></InputIcon>
                  <StyledInput placeholder="+1 555 000 0000" value={form.phone} onChange={set('phone')} />
                </InputWrap>
              </Field>
            )}

            <Field>
              <Label>Password</Label>
              <InputWrap>
                <InputIcon><Lock size={15} /></InputIcon>
                <StyledInput type={showPass ? 'text' : 'password'} placeholder={mode === 'register' ? 'Min 6 characters' : 'Your password'} value={form.password} onChange={set('password')} $hasError={!!errors.password} />
                <ToggleEye type="button" onClick={() => setShowPass(s => !s)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </ToggleEye>
              </InputWrap>
              {errors.password && <ErrorMsg>{errors.password}</ErrorMsg>}
            </Field>

            <SubmitBtn type="submit" $loading={loading} disabled={loading}>
              {loading && <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </SubmitBtn>
          </form>

          {mode === 'register' && (
            <>
              <Divider>Members get</Divider>
              <BenefitsList>
                <BenefitItem>Order history & tracking</BenefitItem>
                <BenefitItem>Loyalty points (1pt per $1 spent)</BenefitItem>
                <BenefitItem>Faster checkout — saved address</BenefitItem>
                <BenefitItem>Wishlist saved to your account</BenefitItem>
              </BenefitsList>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: theme.colors.text }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <SwitchLink type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </SwitchLink>
          </p>
        </Body>
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Overlay>
  );
};

export default AuthModal;