import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { CreditCard, Truck, CheckCircle, Lock, Loader } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { useCart } from '../hooks/useCart';
import { useAppDispatch } from '../store';
import { clearCart } from '../store/cartSlice';
import { showToast } from '../store/uiSlice';
import { theme } from '../styles/theme';
import { Container, Section, Flex, Button, Input, Divider } from '../styles/shared';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { stripeApi } from '../api/storefront';
import { ApiError } from '../api/client';

const Layout = styled.div`
  display:grid;grid-template-columns:1fr 360px;gap:40px;align-items:start;
  @media(max-width:${theme.breakpoints.lg}){grid-template-columns:1fr;}
`;
const FormCard    = styled.div`background:white;border:1px solid #f0f0f0;padding:30px;margin-bottom:24px;`;
const CardTitle   = styled.h3`font-size:16px;font-weight:${theme.fontWeights.medium};color:${theme.colors.textDark};margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid ${theme.colors.primary};display:flex;align-items:center;gap:8px;svg{color:${theme.colors.primary};}`;
const FormGrid    = styled.div<{$cols?:number}>`display:grid;grid-template-columns:repeat(${({$cols})=>$cols??2},1fr);gap:16px;@media(max-width:${theme.breakpoints.sm}){grid-template-columns:1fr;}`;
const FormGroup   = styled.div<{$full?:boolean}>`${({$full})=>$full&&'grid-column:1/-1;'}display:flex;flex-direction:column;gap:6px;`;
const Label       = styled.label`font-size:13px;font-weight:${theme.fontWeights.medium};color:${theme.colors.text};`;
const SInput      = styled(Input)`border-radius:4px;padding:10px 14px;`;
const PayOption   = styled.label<{$active:boolean}>`display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid ${({$active})=>$active?theme.colors.primary:'#dee2e6'};background:${({$active})=>$active?'rgba(130,174,70,0.05)':'white'};cursor:pointer;transition:${theme.transitions.base};margin-bottom:8px;&:hover{border-color:${theme.colors.primary};}`;
const RadioCircle = styled.span<{$active:boolean}>`width:18px;height:18px;border-radius:50%;border:2px solid ${({$active})=>$active?theme.colors.primary:'#dee2e6'};display:flex;align-items:center;justify-content:center;flex-shrink:0;&::after{content:'';width:8px;height:8px;border-radius:50%;background:${theme.colors.primary};display:${({$active})=>$active?'block':'none'};}`;
const OrderSummary= styled.aside`background:white;border:1px solid #f0f0f0;padding:30px;position:sticky;top:20px;`;
const OItem       = styled(Flex)`justify-content:space-between;padding:12px 0;border-bottom:1px solid #f0f0f0;gap:12px;`;
const Thumb       = styled.img`width:44px;height:44px;object-fit:cover;border:1px solid #f0f0f0;flex-shrink:0;`;
const IName       = styled.span`font-size:13px;color:${theme.colors.textDark};flex:1;`;
const ITotal      = styled.span`font-size:13px;font-weight:${theme.fontWeights.semibold};white-space:nowrap;`;
const TRow        = styled(Flex)`justify-content:space-between;font-size:14px;margin-top:8px;span:first-child{color:${theme.colors.text};}span:last-child{font-weight:${theme.fontWeights.medium};}`;
const GTotal      = styled(TRow)`font-size:18px;margin-top:14px;padding-top:14px;border-top:2px solid #f0f0f0;span:last-child{color:${theme.colors.primary};font-weight:${theme.fontWeights.bold};}`;
const SuccessWrap = styled.div`text-align:center;padding:80px 20px;background:white;border:1px solid #f0f0f0;`;

const CheckoutPage: React.FC = () => {
  const { items, subtotal, shipping, total } = useCart();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [payMethod, setPayMethod] = useState<'card'|'paypal'|'cod'>('card');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [form, setForm] = useState({ firstName:'',lastName:'',email:'',phone:'',address:'',city:'',state:'',zip:'',country:'US' });
  const upd = (k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement>)=>setForm(f=>({...f,[k]:e.target.value}));

  const handleSubmit = async () => {
    if (!form.firstName||!form.email||!form.address) { dispatch(showToast({message:'Please fill in all required fields',type:'error'})); return; }
    if (items.length===0) { dispatch(showToast({message:'Your cart is empty',type:'error'})); return; }
    setLoading(true);
    try {
      if (payMethod==='card') {
        const res = await stripeApi.createCheckout(
          items.map(i=>({ name:i.name, price:i.price, quantity:i.quantity, productId:i.id, image:`${window.location.origin}${i.image}` })),
          { name:`${form.firstName} ${form.lastName}`.trim(), email:form.email, phone:form.phone, address:{street:form.address,city:form.city,state:form.state,zip:form.zip,country:form.country} }
        );
        if (res.success && res.data.url) { dispatch(clearCart()); window.location.href=res.data.url; return; }
      } else {
        await new Promise(r=>setTimeout(r,800));
        dispatch(clearCart());
        dispatch(showToast({message:'Order placed successfully! 🎉',type:'success'}));
        setSubmitted(true);
      }
    } catch(err) {
      dispatch(showToast({message:err instanceof ApiError?err.message:'Payment failed. Please try again.',type:'error'}));
    } finally { setLoading(false); }
  };

  if (submitted) return (
    <main><PageHero title="Checkout" breadcrumbs={[{label:'Checkout'}]} /><Section><Container>
      <SuccessWrap>
        <div style={{width:80,height:80,background:'rgba(130,174,70,0.1)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',color:theme.colors.primary}}><CheckCircle size={42}/></div>
        <h2 style={{fontSize:30,marginBottom:12}}>Order Confirmed! 🎉</h2>
        <p style={{color:theme.colors.text,maxWidth:480,margin:'0 auto 24px'}}>Thank you! We've sent a confirmation to <strong>{form.email||'your email'}</strong>. Your fresh produce will arrive in 3–5 business days.</p>
        <Button onClick={()=>navigate('/shop')}>Continue Shopping</Button>
      </SuccessWrap>
    </Container></Section></main>
  );

  return (
    <main>
      <PageHero title="Checkout" breadcrumbs={[{label:'Checkout'}]}/>
      <Section><Container><Layout>
        <div>
          <FormCard>
            <CardTitle><Truck size={18}/> Shipping Information</CardTitle>
            <FormGrid>
              <FormGroup><Label>First Name *</Label><SInput value={form.firstName} onChange={upd('firstName')} placeholder="John"/></FormGroup>
              <FormGroup><Label>Last Name</Label><SInput value={form.lastName} onChange={upd('lastName')} placeholder="Doe"/></FormGroup>
              <FormGroup $full><Label>Email *</Label><SInput type="email" value={form.email} onChange={upd('email')} placeholder="john@example.com"/></FormGroup>
              <FormGroup><Label>Phone</Label><SInput type="tel" value={form.phone} onChange={upd('phone')} placeholder="+1 234 567 890"/></FormGroup>
              <FormGroup><Label>Country</Label><SInput value={form.country} onChange={upd('country')} placeholder="US"/></FormGroup>
              <FormGroup $full><Label>Address *</Label><SInput value={form.address} onChange={upd('address')} placeholder="123 Main Street"/></FormGroup>
              <FormGroup><Label>City</Label><SInput value={form.city} onChange={upd('city')} placeholder="San Francisco"/></FormGroup>
              <FormGroup><Label>State</Label><SInput value={form.state} onChange={upd('state')} placeholder="CA"/></FormGroup>
              <FormGroup><Label>ZIP Code</Label><SInput value={form.zip} onChange={upd('zip')} placeholder="94102"/></FormGroup>
            </FormGrid>
          </FormCard>
          <FormCard>
            <CardTitle><CreditCard size={18}/> Payment Method</CardTitle>
            {(['card','paypal','cod'] as const).map(m=>(
              <PayOption key={m} $active={payMethod===m}>
                <input type="radio" name="pay" hidden checked={payMethod===m} onChange={()=>setPayMethod(m)}/>
                <RadioCircle $active={payMethod===m}/>
                <span style={{fontSize:14,fontWeight:theme.fontWeights.medium}}>
                  {m==='card'?'💳 Credit / Debit Card (Stripe)':m==='paypal'?'🅿️ PayPal':'💵 Cash on Delivery'}
                </span>
              </PayOption>
            ))}
            {payMethod==='card'&&<p style={{fontSize:12,color:theme.colors.text,marginTop:8,padding:'8px 12px',background:'rgba(130,174,70,0.06)',borderRadius:4}}>🔒 You'll be redirected to Stripe's secure checkout page to complete payment.</p>}
          </FormCard>
        </div>
        <OrderSummary>
          <h3 style={{fontSize:18,fontWeight:theme.fontWeights.medium,marginBottom:20,paddingBottom:12,borderBottom:`2px solid ${theme.colors.primary}`}}>Your Order</h3>
          {items.map(item=>(
            <OItem key={item.id} as="div">
              <Thumb src={item.image} alt={item.name} onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/44x44/f1f8f1/82ae46?text=V';}}/>
              <IName>{item.name} × {item.quantity}</IName>
              <ITotal>${(item.price*item.quantity).toFixed(2)}</ITotal>
            </OItem>
          ))}
          <Divider $my="14px"/>
          <TRow as="div"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></TRow>
          <TRow as="div"><span>Shipping</span><span style={{color:shipping===0?theme.colors.primary:undefined}}>{shipping===0?'Free':`$${shipping.toFixed(2)}`}</span></TRow>
          <GTotal as="div"><span>Total</span><span>${total.toFixed(2)}</span></GTotal>
          <Button style={{width:'100%',marginTop:20,justifyContent:'center'}} onClick={handleSubmit} disabled={loading}>
            {loading?<><Loader size={14} style={{animation:'spin 0.8s linear infinite'}}/> Processing…</>:<><Lock size={14}/> {payMethod==='card'?'Pay with Stripe':'Place Order'}</>}
          </Button>
          <p style={{textAlign:'center',fontSize:12,color:theme.colors.text,marginTop:12}}>🔒 Secured by 256-bit SSL encryption</p>
        </OrderSummary>
      </Layout></Container></Section>
      <NewsletterSection/>
    </main>
  );
};

export default CheckoutPage;
