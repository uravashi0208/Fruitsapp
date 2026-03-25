import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Save } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminFlex, AdminBtn, AdminInput, AdminSelect, AdminTextarea,
  FormGroup, FormLabel, FormGrid, AdminDivider,
} from '../styles/adminShared';
import { useAdminDispatch, showAdminToast } from '../store';
import { useAdminSettings } from '../../hooks/useAdminApi';
import { adminSettingsApi } from '../../api/admin';
import { ApiError, API_BASE } from '../../api/client';

/* ── Layout ──────────────────────────────────────────────────── */
const PageWrap = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 0;
  background: #fff;
  border: 1px solid ${t.colors.border};
  border-radius: 14px;
  overflow: hidden;
`;
const NavPanel = styled.nav`
  border-right: 1px solid ${t.colors.border};
  padding: 8px 0;
  background: #fff;
`;
const NavItem = styled.button<{ $active: boolean }>`
  display: block; width: 100%; padding: 11px 24px;
  background: ${({ $active }) => $active ? t.colors.surfaceAlt : 'transparent'};
  color: ${({ $active }) => $active ? t.colors.textPrimary : t.colors.textMuted};
  font-size: 0.875rem; font-weight: ${({ $active }) => $active ? 600 : 400};
  border: none; text-align: left; cursor: pointer;
  transition: background 0.15s, color 0.15s;
  &:hover { background: ${t.colors.surfaceAlt}; color: ${t.colors.textPrimary}; }
`;
const NavDivider = styled.div`height:1px;background:${t.colors.border};margin:6px 0;`;
const ContentPanel = styled.div`padding: 36px 40px;`;
const TabHeading = styled.h2`
  font-size: 1.25rem; font-weight: 700; color: ${t.colors.textPrimary}; margin: 0 0 10px;
`;
const TabDesc = styled.p`
  font-size: 0.875rem; color: ${t.colors.textMuted}; margin: 0 0 28px;
  line-height: 1.7; max-width: 620px;
`;
const SLabel = styled.h3`
  font-size: 0.8125rem; font-weight: 600; color: ${t.colors.textSecondary};
  text-transform: uppercase; letter-spacing: 0.5px;
  margin: 28px 0 14px; padding-bottom: 8px;
  border-bottom: 1px solid ${t.colors.border};
  &:first-of-type { margin-top: 0; }
`;
const ToggleRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 0; border-bottom: 1px solid ${t.colors.border};
  &:last-of-type { border-bottom: none; }
`;
const TName = styled.div`font-size:0.875rem;font-weight:500;color:${t.colors.textPrimary};`;
const TSub  = styled.div`font-size:0.78rem;color:${t.colors.textMuted};margin-top:2px;`;
const Track = styled.div<{ $on: boolean }>`
  width:42px; height:22px; border-radius:99px;
  background:${({ $on }) => $on ? t.colors.primary : '#d0d5dd'};
  position:relative; cursor:pointer; flex-shrink:0; transition:background 0.2s;
  &::after {
    content:''; position:absolute; top:3px;
    left:${({ $on }) => $on ? '22px' : '3px'};
    width:16px; height:16px; border-radius:50%;
    background:white; box-shadow:0 1px 3px rgba(0,0,0,0.2); transition:left 0.2s;
  }
`;
const OverviewCard = styled.div`
  padding:16px 20px; border-radius:10px; border:1px solid ${t.colors.border};
  cursor:pointer; transition:box-shadow 0.15s;
  &:hover { box-shadow:0 2px 12px rgba(0,0,0,0.08); }
`;
const SaveRow = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid ${t.colors.border};
  display: flex;
  justify-content: flex-end;
`;

const TABS = [
  { id:'overview',     label:'Overview'     },
  { id:'store',        label:'Store Info'   },
  { id:'notification', label:'Notification' },
  { id:'shipping',     label:'Shipping'     },
  { id:'email',        label:'Email'        },
  { id:'analytics',    label:'Analytics'    },
  { id:'security',     label:'Security'     },
  { id:'customers',    label:'Customers'    },
  { id:'theme',        label:'Theme'        },
];

/* ── Default form state (mirrors backend getDefaults) ────────── */
const DEFAULTS = {
  // Store
  siteName:'Vegefoods', email:'', phone:'', address:'',
  twitterLink:'', facebookLink:'', instagramLink:'',
  aboutUs:'', metaTitle:'', metaDescription:'',
  // Notifications
  notifNewOrder:true, notifLowStock:true, notifOrderShipped:true,
  notifNewUser:false, notifNewContact:true, notifNewsletter:false,
  // Shipping
  shippingThreshold:100, shippingFee:9.99,
  processingTime:'1-2', deliveryEstimate:'3-5',
  shippingZones:'California, Oregon, Washington, Nevada, Arizona',
  // Email
  smtpHost:'smtp.gmail.com', smtpPort:587,
  smtpUser:'', smtpPass:'',
  mailFromName:'Vegefoods', mailFromEmail:'',
  // Analytics
  gaId:'', gtmId:'', fbPixelId:'', fbConvToken:'',
  // Security
  secTwoFactor:false, secSessionTimeout:true, secRateLimit:true,
  // Customers
  registrationMode:'open', emailVerification:'required',
  guestCheckout:'enabled', accountDeletion:'self',
  // Theme
  themeDefault:'light', fontScale:'md',
};

type SettingsForm = typeof DEFAULTS;

export const SettingsPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const { data: srv, loading } = useAdminSettings();
  const [active,  setActive]  = useState('overview');
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState<SettingsForm>(DEFAULTS);

  /* Populate from server on load */
  useEffect(() => {
    if (!srv) return;
    setForm(prev => ({ ...prev, ...srv }));
  }, [srv]);

  /* Generic field updater */
  const upd = (k: keyof SettingsForm) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

  const toggle = (k: keyof SettingsForm) =>
    setForm(f => ({ ...f, [k]: !f[k] }));

  /* Save current tab fields */
  const save = useCallback(async () => {
    setSaving(true);
    try {
      await adminSettingsApi.update(form as any);
      dispatch(showAdminToast({ message: 'Settings saved successfully', type: 'success' }));
    } catch (err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Failed to save settings', type: 'error' }));
    } finally { setSaving(false); }
  }, [form, dispatch]);

  const [testing, setTesting] = useState(false);

  const testEmail = useCallback(async () => {
    setTesting(true);
    try {
      // Save first so test uses latest credentials
      await adminSettingsApi.update(form as any);
      const res = await fetch(
        `${API_BASE}/api/admin/settings/test-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('vf_access') || ''}`,
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (data.success) {
        dispatch(showAdminToast({ message: data.message || 'Test email sent!', type: 'success' }));
      } else {
        dispatch(showAdminToast({ message: data.message || 'Test failed', type: 'error' }));
      }
    } catch (err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Test email failed', type: 'error' }));
    } finally { setTesting(false); }
  }, [form, dispatch]);

  const SaveBtn = () => (
    <SaveRow>
      <AdminBtn $variant="primary" onClick={save} disabled={saving}>
        <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
      </AdminBtn>
    </SaveRow>
  );

  return (
    <>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:'1.375rem', fontWeight:700, color:t.colors.textPrimary, margin:'0 0 4px' }}>
          Project Settings
        </h1>
        <p style={{ fontSize:'0.8125rem', color:t.colors.textMuted, margin:0 }}>
          Application configuration and preferences
        </p>
      </div>

      <PageWrap>
        {/* ── Left nav ── */}
        <NavPanel>
          {TABS.map(tb => (
            <React.Fragment key={tb.id}>
              {tb.id === 'analytics' && <NavDivider />}
              <NavItem $active={active === tb.id} onClick={() => setActive(tb.id)}>
                {tb.label}
              </NavItem>
            </React.Fragment>
          ))}
        </NavPanel>

        {/* ── Content ── */}
        <ContentPanel>

          {/* ── Overview ── */}
          {active === 'overview' && <>
            <TabHeading>Overview</TabHeading>
            <TabDesc>
              Welcome to Project Settings. Use the navigation on the left to configure your store
              information, notifications, shipping, email setup, analytics, security policies,
              customer management, and the admin panel theme.
            </TabDesc>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                { id:'store',        label:'Store Info',   desc:'Name, address, social links and SEO' },
                { id:'notification', label:'Notification', desc:'Email and in-app alert preferences' },
                { id:'shipping',     label:'Shipping',     desc:'Rates, zones and processing time' },
                { id:'email',        label:'Email',        desc:'SMTP credentials and sender details' },
                { id:'analytics',    label:'Analytics',    desc:'Tracking IDs and reporting setup' },
                { id:'security',     label:'Security',     desc:'2FA, sessions and rate limiting' },
                { id:'customers',    label:'Customers',    desc:'Registration and account policies' },
                { id:'theme',        label:'Theme',        desc:'Fonts and display scale' },
              ].map(item => (
                <OverviewCard key={item.id} onClick={() => setActive(item.id)}>
                  <div style={{ fontWeight:600, fontSize:'0.875rem', color:t.colors.textPrimary, marginBottom:3 }}>{item.label}</div>
                  <div style={{ fontSize:'0.8rem', color:t.colors.textMuted }}>{item.desc}</div>
                </OverviewCard>
              ))}
            </div>
          </>}

          {/* ── Store Info ── */}
          {active === 'store' && <>
            <TabHeading>Store Info</TabHeading>
            <TabDesc>Manage your store's basic information, contact details, social links and SEO metadata.</TabDesc>
            {loading && <p style={{ color:t.colors.textMuted, marginBottom:16 }}>Loading…</p>}
            <SLabel>Basic Information</SLabel>
            <FormGrid $cols={2} style={{ marginBottom:8 }}>
              <FormGroup><FormLabel>Store Name</FormLabel><AdminInput value={form.siteName} onChange={upd('siteName')} placeholder="Vegefoods" /></FormGroup>
              <FormGroup><FormLabel>Support Email</FormLabel><AdminInput type="email" value={form.email} onChange={upd('email')} placeholder="admin@vegefoods.com" /></FormGroup>
              <FormGroup><FormLabel>Phone Number</FormLabel><AdminInput value={form.phone} onChange={upd('phone')} placeholder="+1 234 567 890" /></FormGroup>
              <FormGroup $span={2}><FormLabel>Store Address</FormLabel>
                <AdminTextarea value={form.address} onChange={upd('address')} style={{ minHeight:70 }} placeholder="Full store address…" />
              </FormGroup>
            </FormGrid>
            <SLabel>Social Links</SLabel>
            <FormGrid $cols={2} style={{ marginBottom:8 }}>
              <FormGroup><FormLabel>Twitter / X URL</FormLabel><AdminInput value={form.twitterLink} onChange={upd('twitterLink')} placeholder="https://twitter.com/…" /></FormGroup>
              <FormGroup><FormLabel>Facebook URL</FormLabel><AdminInput value={form.facebookLink} onChange={upd('facebookLink')} placeholder="https://facebook.com/…" /></FormGroup>
              <FormGroup $span={2}><FormLabel>Instagram URL</FormLabel><AdminInput value={form.instagramLink} onChange={upd('instagramLink')} placeholder="https://instagram.com/…" /></FormGroup>
            </FormGrid>
            <SLabel>About & SEO</SLabel>
            <FormGrid $cols={2}>
              <FormGroup $span={2}><FormLabel>About Us</FormLabel>
                <AdminTextarea value={form.aboutUs} onChange={upd('aboutUs')} style={{ minHeight:80 }} placeholder="Brief description of your store…" />
              </FormGroup>
              <FormGroup><FormLabel>Meta Title</FormLabel><AdminInput value={form.metaTitle} onChange={upd('metaTitle')} /></FormGroup>
              <FormGroup><FormLabel>Meta Description</FormLabel><AdminInput value={form.metaDescription} onChange={upd('metaDescription')} /></FormGroup>
            </FormGrid>
            <SaveBtn />
          </>}

          {/* ── Notification ── */}
          {active === 'notification' && <>
            <TabHeading>Notification</TabHeading>
            <TabDesc>Choose which events trigger email and in-app notifications for your admin account.</TabDesc>
            {[
              { k:'notifNewOrder'     as keyof SettingsForm, label:'New Orders',             sub:'Get notified when a customer places an order' },
              { k:'notifLowStock'     as keyof SettingsForm, label:'Low Stock Alerts',       sub:'Alert when product stock drops below 10 units' },
              { k:'notifOrderShipped' as keyof SettingsForm, label:'Order Shipped',          sub:'Notify when an order status changes to shipped' },
              { k:'notifNewUser'      as keyof SettingsForm, label:'New Registrations',      sub:'Notify when a new user registers' },
              { k:'notifNewContact'   as keyof SettingsForm, label:'New Contact Messages',   sub:'Notify when a contact form is submitted' },
              { k:'notifNewsletter'   as keyof SettingsForm, label:'Newsletter Subscribers', sub:'Notify when someone subscribes to the newsletter' },
            ].map(({ k, label, sub }) => (
              <ToggleRow key={k}>
                <div><TName>{label}</TName><TSub>{sub}</TSub></div>
                <Track $on={!!form[k]} onClick={() => toggle(k)} />
              </ToggleRow>
            ))}
            <SaveBtn />
          </>}

          {/* ── Shipping ── */}
          {active === 'shipping' && <>
            <TabHeading>Shipping</TabHeading>
            <TabDesc>Configure shipping rates, processing time and delivery zones for your store.</TabDesc>
            <SLabel>Rates</SLabel>
            <FormGrid $cols={2} style={{ marginBottom:8 }}>
              <FormGroup><FormLabel>Free Shipping Threshold ($)</FormLabel>
                <AdminInput type="number" value={form.shippingThreshold} onChange={upd('shippingThreshold')} />
              </FormGroup>
              <FormGroup><FormLabel>Default Shipping Fee ($)</FormLabel>
                <AdminInput type="number" value={form.shippingFee} onChange={upd('shippingFee')} />
              </FormGroup>
            </FormGrid>
            <SLabel>Timing</SLabel>
            <FormGrid $cols={2} style={{ marginBottom:8 }}>
              <FormGroup><FormLabel>Processing Time</FormLabel>
                <AdminSelect value={form.processingTime} onChange={upd('processingTime')}>
                  <option value="same-day">Same Day</option>
                  <option value="1-2">1–2 Business Days</option>
                  <option value="3-5">3–5 Business Days</option>
                </AdminSelect>
              </FormGroup>
              <FormGroup><FormLabel>Delivery Estimate</FormLabel>
                <AdminSelect value={form.deliveryEstimate} onChange={upd('deliveryEstimate')}>
                  <option value="1-3">1–3 Business Days</option>
                  <option value="3-5">3–5 Business Days</option>
                  <option value="5-7">5–7 Business Days</option>
                </AdminSelect>
              </FormGroup>
            </FormGrid>
            <SLabel>Zones</SLabel>
            <FormGrid $cols={1}>
              <FormGroup><FormLabel>Shipping Zones (comma-separated)</FormLabel>
                <AdminInput value={form.shippingZones} onChange={upd('shippingZones')} />
              </FormGroup>
            </FormGrid>
            <SaveBtn />
          </>}

          {/* ── Email ── */}
          {active === 'email' && <>
            <TabHeading>Email</TabHeading>
            <TabDesc>
              Configure SMTP credentials for sending transactional emails. These settings are stored in the
              database — no need to set environment variables. Click <strong>Test Email</strong> to verify
              your credentials after saving.
            </TabDesc>
            <SLabel>SMTP Configuration</SLabel>
            <FormGrid $cols={2}>
              <FormGroup><FormLabel>SMTP Host</FormLabel><AdminInput value={form.smtpHost} onChange={upd('smtpHost')} placeholder="smtp.gmail.com" /></FormGroup>
              <FormGroup><FormLabel>SMTP Port</FormLabel><AdminInput type="number" value={form.smtpPort} onChange={upd('smtpPort')} /></FormGroup>
              <FormGroup><FormLabel>SMTP Username</FormLabel><AdminInput value={form.smtpUser} onChange={upd('smtpUser')} placeholder="your@gmail.com" /></FormGroup>
              <FormGroup><FormLabel>SMTP Password</FormLabel><AdminInput type="password" value={form.smtpPass} onChange={upd('smtpPass')} placeholder="16-char app password" /></FormGroup>
              <FormGroup><FormLabel>From Name</FormLabel><AdminInput value={form.mailFromName} onChange={upd('mailFromName')} /></FormGroup>
              <FormGroup><FormLabel>From Email</FormLabel><AdminInput type="email" value={form.mailFromEmail} onChange={upd('mailFromEmail')} placeholder="noreply@vegefoods.com" /></FormGroup>
            </FormGrid>
            <div style={{ marginTop: 12, padding: '12px 16px', background: '#f9fdf3', border: '1px solid #d4edbb', borderRadius: 8, fontSize: '0.8125rem', color: '#555' }}>
              💡 <strong>Gmail tip:</strong> Use an App Password (not your regular password).
              Go to Google Account → Security → 2-Step Verification → App Passwords.
            </div>
            <SaveRow>
              <AdminBtn $variant="ghost" onClick={testEmail} disabled={testing} style={{ marginRight: 10 }}>
                {testing ? 'Sending…' : '📧 Test Email'}
              </AdminBtn>
              <AdminBtn $variant="primary" onClick={save} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </AdminBtn>
            </SaveRow>
          </>}

          {/* ── Analytics ── */}
          {active === 'analytics' && <>
            <TabHeading>Analytics</TabHeading>
            <TabDesc>Connect analytics and tracking tools to monitor your store performance and customer behaviour.</TabDesc>
            <SLabel>Google</SLabel>
            <FormGrid $cols={2} style={{ marginBottom:8 }}>
              <FormGroup><FormLabel>Google Analytics ID</FormLabel><AdminInput value={form.gaId} onChange={upd('gaId')} placeholder="G-XXXXXXXXXX" /></FormGroup>
              <FormGroup><FormLabel>Google Tag Manager ID</FormLabel><AdminInput value={form.gtmId} onChange={upd('gtmId')} placeholder="GTM-XXXXXXX" /></FormGroup>
            </FormGrid>
            <SLabel>Meta / Facebook</SLabel>
            <FormGrid $cols={2}>
              <FormGroup><FormLabel>Facebook Pixel ID</FormLabel><AdminInput value={form.fbPixelId} onChange={upd('fbPixelId')} placeholder="123456789012345" /></FormGroup>
              <FormGroup><FormLabel>Meta Conversions API Token</FormLabel><AdminInput value={form.fbConvToken} onChange={upd('fbConvToken')} placeholder="EAA…" /></FormGroup>
            </FormGrid>
            <SaveBtn />
          </>}

          {/* ── Security ── */}
          {active === 'security' && <>
            <TabHeading>Security</TabHeading>
            <TabDesc>Manage authentication rules, session policies and API access controls for the admin panel.</TabDesc>
            {[
              { k:'secTwoFactor'      as keyof SettingsForm, label:'Two-Factor Authentication', sub:'Require 2FA for all admin logins' },
              { k:'secSessionTimeout' as keyof SettingsForm, label:'Session Timeout',           sub:'Auto-logout after 60 minutes of inactivity' },
              { k:'secRateLimit'      as keyof SettingsForm, label:'API Rate Limiting',         sub:'Limit API requests to 100/minute per IP' },
            ].map(({ k, label, sub }) => (
              <ToggleRow key={k}>
                <div><TName>{label}</TName><TSub>{sub}</TSub></div>
                <Track $on={!!form[k]} onClick={() => toggle(k)} />
              </ToggleRow>
            ))}
            <div style={{ marginTop:20, marginBottom:8 }}>
              <AdminBtn $variant="danger" $size="sm">Revoke All Sessions</AdminBtn>
            </div>
            <SaveBtn />
          </>}

          {/* ── Customers ── */}
          {active === 'customers' && <>
            <TabHeading>Customers</TabHeading>
            <TabDesc>Configure customer registration, account verification and profile management policies.</TabDesc>
            <SLabel>Registration</SLabel>
            <FormGrid $cols={2} style={{ marginBottom:8 }}>
              <FormGroup><FormLabel>Registration Mode</FormLabel>
                <AdminSelect value={form.registrationMode} onChange={upd('registrationMode')}>
                  <option value="open">Open (anyone can register)</option>
                  <option value="invite">Invite only</option>
                  <option value="closed">Closed</option>
                </AdminSelect>
              </FormGroup>
              <FormGroup><FormLabel>Email Verification</FormLabel>
                <AdminSelect value={form.emailVerification} onChange={upd('emailVerification')}>
                  <option value="required">Required</option>
                  <option value="optional">Optional</option>
                  <option value="none">None</option>
                </AdminSelect>
              </FormGroup>
            </FormGrid>
            <SLabel>Policies</SLabel>
            <FormGrid $cols={2}>
              <FormGroup><FormLabel>Guest Checkout</FormLabel>
                <AdminSelect value={form.guestCheckout} onChange={upd('guestCheckout')}>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </AdminSelect>
              </FormGroup>
              <FormGroup><FormLabel>Account Deletion</FormLabel>
                <AdminSelect value={form.accountDeletion} onChange={upd('accountDeletion')}>
                  <option value="self">Customer can self-delete</option>
                  <option value="admin">Admin only</option>
                </AdminSelect>
              </FormGroup>
            </FormGrid>
            <SaveBtn />
          </>}

          {/* ── Theme ── (no Colours section) */}
          {active === 'theme' && <>
            <TabHeading>Theme</TabHeading>
            <TabDesc>Adjust the visual appearance of the admin panel including fonts and layout scale.</TabDesc>
            <SLabel>Display</SLabel>
            <FormGrid $cols={2}>
              <FormGroup><FormLabel>Default Theme</FormLabel>
                <AdminSelect value={form.themeDefault} onChange={upd('themeDefault')}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </AdminSelect>
              </FormGroup>
              <FormGroup><FormLabel>Font Scale</FormLabel>
                <AdminSelect value={form.fontScale} onChange={upd('fontScale')}>
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </AdminSelect>
              </FormGroup>
            </FormGrid>
            <SaveBtn />
          </>}

        </ContentPanel>
      </PageWrap>
    </>
  );
};
