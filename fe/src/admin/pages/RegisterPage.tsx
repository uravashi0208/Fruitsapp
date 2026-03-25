import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import { useAdminDispatch, login } from '../store';
import { adminAuthApi } from '../../api/admin';
import { ApiError } from '../../api/client';

const fadeIn = keyframes`from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}`;

const Page     = styled.div`min-height:100vh;display:flex;background:white;`;
const FormSide = styled.div`display:flex;flex-direction:column;justify-content:center;width:100%;padding:2rem 1.5rem;@media(min-width:1024px){width:50%;padding:3rem 4rem;}animation:${fadeIn} 0.4s ease;`;
const BrandSide= styled.div`display:none;@media(min-width:1024px){display:flex;align-items:center;justify-content:center;width:50%;background:#161950;position:relative;overflow:hidden;}`;
const BrandInner=styled.div`position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;max-width:360px;text-align:center;padding:2rem;`;
const BrandLogo =styled.div`width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#465fff,#3641f5);display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;margin-bottom:1.5rem;box-shadow:0 20px 40px rgba(70,95,255,0.4);letter-spacing:-1px;font-family:${t.fonts.heading};`;
const BrandTitle=styled.h2`font-size:1.75rem;font-weight:700;color:white;margin-bottom:0.75rem;line-height:1.3;letter-spacing:-0.3px;`;
const BrandDesc =styled.p`font-size:0.9375rem;color:rgba(255,255,255,0.55);line-height:1.7;`;
const GridBg    =styled.div`position:absolute;inset:0;opacity:0.06;background-image:linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px);background-size:40px 40px;`;
const StepList  =styled.ul`list-style:none;margin-top:2rem;display:flex;flex-direction:column;gap:1rem;text-align:left;width:100%;`;
const StepItem  =styled.li`display:flex;align-items:flex-start;gap:12px;`;
const StepNum   =styled.span`width:24px;height:24px;border-radius:50%;border:1.5px solid rgba(70,95,255,0.5);background:rgba(70,95,255,0.1);color:#9cb9ff;font-size:0.7rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;`;
const StepText  =styled.div`font-size:0.875rem;color:rgba(255,255,255,0.6);line-height:1.5;strong{color:white;}`;

const FormHead  =styled.div`margin-bottom:1.75rem;`;
const FormTitle =styled.h1`font-size:1.75rem;font-weight:700;color:${t.colors.textPrimary};margin-bottom:0.375rem;letter-spacing:-0.3px;`;
const FormSub   =styled.p`font-size:0.9375rem;color:${t.colors.textMuted};`;

const ErrorBox  =styled.div`display:flex;align-items:center;gap:8px;background:#fef3f2;border:1px solid #fecdca;border-radius:${t.radii.lg};padding:0.75rem 1rem;margin-bottom:1rem;font-size:0.8125rem;color:#b42318;`;
const SuccessBox=styled.div`display:flex;align-items:center;gap:8px;background:#ecfdf3;border:1px solid #a6f4c5;border-radius:${t.radii.lg};padding:0.75rem 1rem;margin-bottom:1rem;font-size:0.8125rem;color:#027a48;`;

const TwoCol   =styled.div`display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;@media(max-width:480px){grid-template-columns:1fr;}`;
const Field    =styled.div`margin-bottom:1rem;`;
const Label    =styled.label`display:block;font-size:0.8125rem;font-weight:500;color:${t.colors.textSecondary};margin-bottom:0.375rem;`;
const InputWrap=styled.div`position:relative;`;
const Input    =styled.input`width:100%;padding:0.75rem 1rem;border:1px solid ${t.colors.border};border-radius:${t.radii.lg};font-family:${t.fonts.body};font-size:0.875rem;color:${t.colors.textPrimary};background:white;outline:none;box-shadow:${t.shadows.xs};transition:all 0.15s ease;&::placeholder{color:${t.colors.textMuted};}&:focus{border-color:${t.colors.primary};box-shadow:${t.shadows.focus};}`;
const Select   =styled.select`width:100%;padding:0.75rem 2rem 0.75rem 1rem;border:1px solid ${t.colors.border};border-radius:${t.radii.lg};font-family:${t.fonts.body};font-size:0.875rem;color:${t.colors.textPrimary};background:white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2398a2b3' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 8px center/16px;appearance:none;outline:none;box-shadow:${t.shadows.xs};cursor:pointer;&:focus{border-color:${t.colors.primary};box-shadow:${t.shadows.focus};}`;
const PwToggle =styled.button`position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:${t.colors.textMuted};cursor:pointer;display:flex;padding:0;&:hover{color:${t.colors.textSecondary};}`;

const StrengthBar=styled.div`margin-top:6px;height:3px;background:${t.colors.border};border-radius:99px;overflow:hidden;`;
const StrengthFill=styled.div<{$p:number;$c:string}>`height:100%;width:${({$p})=>$p}%;background:${({$c})=>$c};border-radius:99px;transition:width 0.3s ease,background 0.3s ease;`;
const StrengthLabel=styled.span`font-size:0.7rem;color:${t.colors.textMuted};margin-top:3px;display:block;`;

const TermsRow =styled.div`margin-bottom:1.5rem;`;
const CheckLabel=styled.label`display:flex;align-items:flex-start;gap:8px;font-size:0.8125rem;color:${t.colors.textSecondary};cursor:pointer;line-height:1.5;input{accent-color:${t.colors.primary};width:15px;height:15px;margin-top:1px;flex-shrink:0;}a{color:${t.colors.primary};text-decoration:none;&:hover{text-decoration:underline;}}`;

const SubmitBtn=styled.button`width:100%;padding:0.8125rem;background:${t.colors.primary};color:white;border:none;border-radius:${t.radii.lg};font-family:${t.fonts.body};font-size:0.9375rem;font-weight:600;cursor:pointer;transition:all 0.15s ease;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:1.25rem;box-shadow:0 1px 2px rgba(70,95,255,0.25);&:hover{background:${t.colors.primaryDark};box-shadow:0 4px 12px rgba(70,95,255,0.35);transform:translateY(-1px);}&:active{transform:scale(0.98);}&:disabled{opacity:0.6;cursor:not-allowed;transform:none;}`;
const BottomRow=styled.p`text-align:center;font-size:0.875rem;color:${t.colors.textMuted};a{color:${t.colors.primary};font-weight:600;text-decoration:none;&:hover{text-decoration:underline;}}`;
const BackLink =styled(Link)`display:block;text-align:center;margin-top:0.75rem;font-size:0.8125rem;color:${t.colors.textMuted};text-decoration:none;&:hover{color:${t.colors.textSecondary};}`;

const pwStr=(pw:string)=>{
  let s=0; if(pw.length>=8)s++; if(/[A-Z]/.test(pw))s++; if(/[0-9]/.test(pw))s++; if(/[^A-Za-z0-9]/.test(pw))s++;
  return [{p:0,c:'transparent',l:''},{p:25,c:'#f04438',l:'Weak'},{p:50,c:'#f79009',l:'Fair'},{p:75,c:'#0ba5ec',l:'Good'},{p:100,c:'#12b76a',l:'Strong'}][s];
};

export const RegisterPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({firstName:'',lastName:'',email:'',phone:'',role:'viewer',password:'',confirm:''});
  const [showPw,  setShowPw]  = useState(false);
  const [showCf,  setShowCf]  = useState(false);
  const [terms,   setTerms]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const set=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setForm(f=>({...f,[k]:e.target.value}));
  const str=pwStr(form.password);

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault(); setError(''); setSuccess('');
    if(!form.firstName||!form.lastName){setError('First and last name are required.');return;}
    if(!form.email.includes('@')){setError('Enter a valid email address.');return;}
    if(form.password.length<6){setError('Password must be at least 6 characters.');return;}
    if(form.password!==form.confirm){setError('Passwords do not match.');return;}
    if(!terms){setError('Please accept the terms to continue.');return;}
    setLoading(true);
    try {
      const res=await adminAuthApi.register({name:`${form.firstName} ${form.lastName}`.trim(),email:form.email,password:form.password,phone:form.phone||undefined,role:form.role as any});
      if(res.success){
        dispatch(login({id:res.data.user.uid,name:res.data.user.name,email:res.data.user.email,role:res.data.user.role}));
        setSuccess('Account created! Redirecting…');
        setTimeout(()=>navigate('/admin'),1500);
      }
    } catch(err){setError(err instanceof ApiError?err.message:'Registration failed. Please try again.');
    } finally{setLoading(false);}
  };

  return (
    <Page>
      <FormSide>
        <div style={{maxWidth:460,width:'100%',margin:'0 auto'}}>
          <FormHead>
            <FormTitle>Create account</FormTitle>
            <FormSub>Join the Vegefoods admin panel</FormSub>
          </FormHead>
          {error&&<ErrorBox><AlertCircle size={15}/>{error}</ErrorBox>}
          {success&&<SuccessBox><CheckCircle size={15}/>{success}</SuccessBox>}
          <form onSubmit={handleSubmit}>
            <TwoCol>
              <Field><Label>First name *</Label><Input placeholder="John" value={form.firstName} onChange={set('firstName')}/></Field>
              <Field><Label>Last name *</Label><Input placeholder="Doe" value={form.lastName} onChange={set('lastName')}/></Field>
            </TwoCol>
            <Field><Label>Email address *</Label><Input type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} autoComplete="email"/></Field>
            <TwoCol>
              <Field><Label>Phone</Label><Input type="tel" placeholder="+1 555-0000" value={form.phone} onChange={set('phone')}/></Field>
              <Field><Label>Role</Label><Select value={form.role} onChange={set('role')}><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></Select></Field>
            </TwoCol>
            <Field>
              <Label>Password *</Label>
              <InputWrap>
                <Input type={showPw?'text':'password'} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} style={{paddingRight:'2.75rem'}} autoComplete="new-password"/>
                <PwToggle type="button" onClick={()=>setShowPw(v=>!v)}>{showPw?<Eye size={16}/>:<EyeOff size={16}/>}</PwToggle>
              </InputWrap>
              {form.password&&<><StrengthBar><StrengthFill $p={str.p} $c={str.c}/></StrengthBar><StrengthLabel>{str.l&&`Strength: ${str.l}`}</StrengthLabel></>}
            </Field>
            <Field>
              <Label>Confirm password *</Label>
              <InputWrap>
                <Input type={showCf?'text':'password'} placeholder="Repeat your password" value={form.confirm} onChange={set('confirm')} style={{paddingRight:'2.75rem'}} autoComplete="new-password"/>
                <PwToggle type="button" onClick={()=>setShowCf(v=>!v)}>{showCf?<Eye size={16}/>:<EyeOff size={16}/>}</PwToggle>
              </InputWrap>
            </Field>
            <TermsRow>
              <CheckLabel><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/> I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></CheckLabel>
            </TermsRow>
            <SubmitBtn type="submit" disabled={loading}>
              {loading?<><span style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'adminSpin 0.7s linear infinite',display:'inline-block'}}/>Creating account…</>:'Create Account'}
            </SubmitBtn>
          </form>
          <BottomRow>Already have an account? <Link to="/admin/login">Sign in</Link></BottomRow>
          <BackLink to="/">← Back to store</BackLink>
        </div>
      </FormSide>
      <BrandSide>
        <GridBg/>
        <BrandInner>
          <BrandLogo>VF</BrandLogo>
          <BrandTitle>Get started in minutes</BrandTitle>
          <BrandDesc>Create your admin account and take full control of your Vegefoods store.</BrandDesc>
          <StepList>
            {[{n:1,t:'Fill your details',d:'Basic info and a secure password.'},{n:2,t:'Choose your role',d:'Admin, editor, or viewer access.'},{n:3,t:'Start managing',d:'Dashboard, products, orders & more.'}].map(s=>(
              <StepItem key={s.n}><StepNum>{s.n}</StepNum><StepText><strong>{s.t}</strong><br/>{s.d}</StepText></StepItem>
            ))}
          </StepList>
        </BrandInner>
      </BrandSide>
    </Page>
  );
};
