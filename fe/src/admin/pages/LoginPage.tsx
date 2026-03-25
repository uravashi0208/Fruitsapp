import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import { useAdminDispatch, login } from '../store';
import { adminAuthApi } from '../../api/admin';
import { ApiError } from '../../api/client';

const fadeIn = keyframes`from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}`;

// ── Layout — mirrors TailAdmin AuthPageLayout ──────────────────
const Page    = styled.div`min-height:100vh;display:flex;background:white;`;
const FormSide= styled.div`
  display:flex;flex-direction:column;justify-content:center;
  width:100%;padding:2rem 1.5rem;
  @media(min-width:1024px){width:50%;padding:3rem 4rem;}
  animation:${fadeIn} 0.4s ease;
`;
const BrandSide=styled.div`
  display:none;
  @media(min-width:1024px){
    display:flex;align-items:center;justify-content:center;
    width:50%;background:#161950;position:relative;overflow:hidden;
  }
`;
const BrandInner=styled.div`
  position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;
  max-width:360px;text-align:center;padding:2rem;
`;
const BrandLogo=styled.div`
  width:64px;height:64px;border-radius:18px;
  background:linear-gradient(135deg,#465fff,#3641f5);
  display:flex;align-items:center;justify-content:center;
  color:white;font-size:1.5rem;font-weight:800;
  margin-bottom:1.5rem;
  box-shadow:0 20px 40px rgba(70,95,255,0.4);
  letter-spacing:-1px;font-family:${t.fonts.heading};
`;
const BrandTitle=styled.h2`
  font-size:1.75rem;font-weight:700;color:white;margin-bottom:0.75rem;line-height:1.3;letter-spacing:-0.3px;
`;
const BrandDesc=styled.p`font-size:0.9375rem;color:rgba(255,255,255,0.55);line-height:1.7;`;
const Features=styled.ul`
  list-style:none;margin-top:2rem;display:flex;flex-direction:column;gap:0.75rem;text-align:left;width:100%;
`;
const FItem=styled.li`
  display:flex;align-items:center;gap:10px;font-size:0.875rem;color:rgba(255,255,255,0.65);
  &::before{content:'';width:7px;height:7px;border-radius:50%;background:#465fff;flex-shrink:0;box-shadow:0 0 8px rgba(70,95,255,0.8);}
`;
// Decorative grid bg
const GridBg=styled.div`
  position:absolute;inset:0;opacity:0.06;
  background-image:linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px);
  background-size:40px 40px;
`;

// ── Form elements ──────────────────────────────────────────────
const FormHead=styled.div`margin-bottom:2rem;`;
const FormTitle=styled.h1`font-size:1.75rem;font-weight:700;color:${t.colors.textPrimary};margin-bottom:0.375rem;letter-spacing:-0.3px;`;
const FormSub=styled.p`font-size:0.9375rem;color:${t.colors.textMuted};`;


const ErrorBox=styled.div`
  display:flex;align-items:center;gap:8px;
  background:#fef3f2;border:1px solid #fecdca;border-radius:${t.radii.lg};
  padding:0.75rem 1rem;margin-bottom:1rem;font-size:0.8125rem;color:#b42318;
`;

const Field=styled.div`margin-bottom:1.25rem;`;
const Label=styled.label`display:block;font-size:0.8125rem;font-weight:500;color:${t.colors.textSecondary};margin-bottom:0.4rem;`;
const InputWrap=styled.div`position:relative;`;
const Input=styled.input`
  width:100%;padding:0.75rem 1rem;
  border:1px solid ${t.colors.border};border-radius:${t.radii.lg};
  font-family:${t.fonts.body};font-size:0.875rem;color:${t.colors.textPrimary};
  background:white;outline:none;
  box-shadow:${t.shadows.xs};
  transition:all 0.15s ease;
  &::placeholder{color:${t.colors.textMuted};}
  &:focus{border-color:${t.colors.primary};box-shadow:${t.shadows.focus};}
`;
const PwToggle=styled.button`
  position:absolute;right:12px;top:50%;transform:translateY(-50%);
  background:none;border:none;color:${t.colors.textMuted};cursor:pointer;
  display:flex;padding:0;
  &:hover{color:${t.colors.textSecondary};}
`;

const Row=styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;`;
const CheckRow=styled.label`display:flex;align-items:center;gap:8px;font-size:0.8125rem;color:${t.colors.textSecondary};cursor:pointer;input{accent-color:${t.colors.primary};}`;
const ForgotLink=styled(Link)`font-size:0.8125rem;color:${t.colors.primary};text-decoration:none;&:hover{text-decoration:underline;}`;

const SubmitBtn=styled.button`
  width:100%;padding:0.8125rem;
  background:${t.colors.primary};color:white;
  border:none;border-radius:${t.radii.lg};
  font-family:${t.fonts.body};font-size:0.9375rem;font-weight:600;
  cursor:pointer;transition:all 0.15s ease;
  display:flex;align-items:center;justify-content:center;gap:8px;
  margin-bottom:1.5rem;
  box-shadow:0 1px 2px rgba(70,95,255,0.25);
  &:hover{background:${t.colors.primaryDark};box-shadow:0 4px 12px rgba(70,95,255,0.35);transform:translateY(-1px);}
  &:active{transform:scale(0.98);}
  &:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
`;
const BottomRow=styled.p`text-align:center;font-size:0.875rem;color:${t.colors.textMuted};a{color:${t.colors.primary};font-weight:600;text-decoration:none;&:hover{text-decoration:underline;}}`;
const BackLink=styled(Link)`display:block;text-align:center;margin-top:0.75rem;font-size:0.8125rem;color:${t.colors.textMuted};text-decoration:none;&:hover{color:${t.colors.textSecondary};}`;

export const LoginPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from     = (location.state as any)?.from?.pathname || '/admin';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const res = await adminAuthApi.login(email, password);
      if (res.success) {
        dispatch(login({ id: res.data.user.uid, name: res.data.user.name, email: res.data.user.email, role: res.data.user.role }));
        navigate(from, { replace: true });
      }
    } catch(err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <Page>
      {/* Form side */}
      <FormSide>
        <div style={{ maxWidth: 440, width: '100%', margin: '0 auto' }}>
          <FormHead>
            <FormTitle>Sign in</FormTitle>
            <FormSub>Enter your credentials to access the admin panel</FormSub>
          </FormHead>

          {error && <ErrorBox><AlertCircle size={15}/>{error}</ErrorBox>}

          <form onSubmit={handleSubmit}>
            <Field>
              <Label>Email address <span style={{color:'#f04438'}}>*</span></Label>
              <Input type="email" placeholder="info@vegefoods.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"/>
            </Field>
            <Field>
              <Label>Password <span style={{color:'#f04438'}}>*</span></Label>
              <InputWrap>
                <Input type={showPw?'text':'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{paddingRight:'2.75rem'}}/>
                <PwToggle type="button" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <Eye size={16}/> : <EyeOff size={16}/>}
                </PwToggle>
              </InputWrap>
            </Field>
            <Row>
              <CheckRow><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/> Keep me logged in</CheckRow>
              <ForgotLink to="#">Forgot password?</ForgotLink>
            </Row>
            <SubmitBtn type="submit" disabled={loading}>
              {loading
                ? <><span style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'adminSpin 0.7s linear infinite',display:'inline-block'}}/> Signing in…</>
                : 'Sign in'}
            </SubmitBtn>
          </form>

          <BottomRow>Don't have an account? <Link to="/admin/register">Sign up</Link></BottomRow>
          <BackLink to="/">← Back to store</BackLink>
        </div>
      </FormSide>

      {/* Brand side */}
      <BrandSide>
        <GridBg/>
        <BrandInner>
          <BrandLogo>VF</BrandLogo>
          <BrandTitle>Manage your store with confidence</BrandTitle>
          <BrandDesc>Full control over products, orders, users, and analytics — all from one powerful dashboard.</BrandDesc>
          <Features>
            {['Real-time order tracking & management','Full product CRUD with inventory','Customer & card detail management','Contact inbox & support center','Wishlist tracking per user'].map(f => <FItem key={f}>{f}</FItem>)}
          </Features>
        </BrandInner>
      </BrandSide>
    </Page>
  );
};
