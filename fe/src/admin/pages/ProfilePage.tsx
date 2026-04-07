/**
 * src/admin/pages/ProfilePage.tsx
 * Admin: user profile — view and edit personal info, address, social links.
 *
 * Page structure (consistent across ALL admin pages):
 *   1. useState declarations  (1a. data/form → 1b. UI/loading)
 *   2. Data init              (useEffect — populate form from Redux user)
 *   3. Action handlers        (save — useCallback)
 *   4. Return JSX             (profile header → personal card → address card → social card)
 */
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Edit2, Save, X } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  AdminBtn, AdminInput, AdminTextarea,
  FormGroup, FormLabel, FormGrid,
} from '../styles/adminShared';
import { useAdminDispatch, useAdminSelector, showAdminToast } from '../store';
import { adminAuthApi } from '../../api/admin';
import { ApiError } from '../../api/client';
import { BiLogoFacebook, BiLogoTwitter,BiLogoLinkedin,BiLogoInstagramAlt } from "react-icons/bi";

/* ── Styled ──────────────────────────────────────────────────── */
const PageWrap   = styled.div`width: stretch;background: white; border: 1px solid ${t.colors.border};
  border-radius: 12px; padding: 20px 25px;`;
const Card       = styled.div`
  background: white; border: 1px solid ${t.colors.border};
  border-radius: 12px; padding: 28px 32px; margin-bottom: 20px;
`;
const CardHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
`;
const CardTitle  = styled.h2`
  font-size: 1rem; font-weight: 700; color: ${t.colors.textPrimary}; margin: 0;
`;
const EditBtn    = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 11px 27px; border-radius: 20px;
  border: 1px solid ${t.colors.border}; background: white;
  font-size: 0.8125rem; font-weight: 500; color: ${t.colors.textSecondary};
  cursor: pointer; transition: all 0.15s;
  &:hover { border-color: ${t.colors.primary}; color: ${t.colors.primary}; }
`;
const Avatar     = styled.div`
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg,#465fff,#3641f5);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 1.5rem; font-weight: 700; flex-shrink: 0;
`;
const SocialBtn  = styled.a`
font-size: 23px;
  width: 38px; height: 38px; border-radius: 50%;
  border: 1px solid var(--color-gray-300); background: white;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--color-gray-700); cursor: pointer; transition: all 0.15s;
  text-decoration: none;
  &:hover { border-color: ${t.colors.primary}; color: ${t.colors.primary}; }
`;
const InfoLabel  = styled.div`font-size: 0.75rem; color: ${t.colors.textMuted}; margin-bottom: 4px;`;
const InfoValue  = styled.div`font-size: 0.875rem; font-weight: 600; color: ${t.colors.textPrimary};`;
const InfoGrid   = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px;
  @media(max-width:600px){ grid-template-columns:1fr; }
`;

/* ── Component ───────────────────────────────────────────────── */
type ProfileForm = {
  firstName: string; lastName: string; bio: string;
  email: string; phone: string;
  country: string; city: string; postalCode: string; taxId: string;
  facebook: string; twitter: string; linkedin: string; instagram: string;
};

const empty = (): ProfileForm => ({
  firstName:'', lastName:'', bio:'',
  email:'', phone:'',
  country:'', city:'', postalCode:'', taxId:'',
  facebook:'', twitter:'', linkedin:'', instagram:'',
});

export const ProfilePage: React.FC = () => {
  const dispatch   = useAdminDispatch();
  const user       = useAdminSelector(s => s.adminAuth.user);

  // 1a. Form data
  const [form,     setForm]     = useState<ProfileForm>(empty());

  // 1b. UI / loading
  const [editMode, setEditMode] = useState<'personal' | 'address' | 'social' | null>(null);
  const [saving,   setSaving]   = useState(false);

  // 2. Data init
  useEffect(() => {
    if (!user) return;
    const nameParts = (user.name || '').split(' ');
    setForm({
      firstName: (user as any).firstName || nameParts[0] || '',
      lastName:  (user as any).lastName  || nameParts.slice(1).join(' ') || '',
      bio:       (user as any).bio        || '',
      email:     user.email               || '',
      phone:     (user as any).phone       || '',
      country:   (user as any).country    || '',
      city:      (user as any).city       || '',
      postalCode:(user as any).postalCode || '',
      taxId:     (user as any).taxId      || '',
      facebook:  (user as any).facebook   || '',
      twitter:   (user as any).twitter    || '',
      linkedin:  (user as any).linkedin   || '',
      instagram: (user as any).instagram  || '',
    });
  }, [user]);

  const upd = (k: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  // 3. Action handlers
  const save = useCallback(async () => {
    setSaving(true);
    try {
      await adminAuthApi.updateProfile({
        firstName: form.firstName, lastName: form.lastName,
        bio: form.bio, phone: form.phone,
        country: form.country, city: form.city,
        postalCode: form.postalCode, taxId: form.taxId,
        facebook: form.facebook, twitter: form.twitter,
        linkedin: form.linkedin, instagram: form.instagram,
      } as any);
      dispatch(showAdminToast({ message: 'Profile updated successfully', type: 'success' }));
      setEditMode(null);
    } catch (err) {
      dispatch(showAdminToast({ message: err instanceof ApiError ? err.message : 'Update failed', type: 'error' }));
    } finally { setSaving(false); }
  }, [form, dispatch]);

  const initials = `${form.firstName[0] || ''}${form.lastName[0] || ''}`.toUpperCase() || (user?.name?.[0] || 'U').toUpperCase();
  const fullName = [form.firstName, form.lastName].filter(Boolean).join(' ') || user?.name || 'Admin';

  // 4. Render
  return (
    <PageWrap>
      {/* ── Top profile header card ── */}
      <Card>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <Avatar>{initials}</Avatar>
            <div>
              <div style={{ fontSize:'1.1rem', fontWeight:700, color:t.colors.textPrimary, marginBottom:4 }}>{fullName}</div>
              <div style={{ fontSize:'0.8125rem', color:t.colors.textMuted }}>
                {form.bio || user?.role || 'Admin'}
                {(form.city || form.country) && (
                  <span style={{ marginLeft:8, paddingLeft:8, borderLeft:`1px solid ${t.colors.border}` }}>
                    {[form.city, form.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {[
              { href: form.facebook,  icon: React.createElement(BiLogoFacebook  as any) },
              { href: form.twitter,   icon: React.createElement(BiLogoTwitter   as any) },
              { href: form.linkedin,  icon: React.createElement(BiLogoLinkedin  as any) },
              { href: form.instagram, icon: React.createElement(BiLogoInstagramAlt as any) },
            ].map(({ href, icon }, i) => (
              <SocialBtn key={i} href={href || '#'} target="_blank" rel="noopener noreferrer">
                {icon}
              </SocialBtn>
            ))}
            <EditBtn onClick={() => setEditMode('social')} style={{ marginLeft:4 }}>
              <Edit2 size={13} /> Edit
            </EditBtn>
          </div>
        </div>

        {/* Social edit inline */}
        {editMode === 'social' && (
          <div style={{ marginTop:24, paddingTop:20, borderTop:`1px solid ${t.colors.border}` }}>
            <FormGrid $cols={2}>
              <FormGroup><FormLabel>Facebook URL</FormLabel><AdminInput value={form.facebook} onChange={upd('facebook')} placeholder="https://facebook.com/…" /></FormGroup>
              <FormGroup><FormLabel>Twitter / X URL</FormLabel><AdminInput value={form.twitter} onChange={upd('twitter')} placeholder="https://twitter.com/…" /></FormGroup>
              <FormGroup><FormLabel>LinkedIn URL</FormLabel><AdminInput value={form.linkedin} onChange={upd('linkedin')} placeholder="https://linkedin.com/in/…" /></FormGroup>
              <FormGroup><FormLabel>Instagram URL</FormLabel><AdminInput value={form.instagram} onChange={upd('instagram')} placeholder="https://instagram.com/…" /></FormGroup>
            </FormGrid>
            <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
              <EditBtn onClick={() => setEditMode(null)}><X size={13} /> Cancel</EditBtn>
              <AdminBtn $variant="primary" onClick={save} disabled={saving}><Save size={13} /> {saving ? 'Saving…' : 'Save'}</AdminBtn>
            </div>
          </div>
        )}
      </Card>

      {/* ── Personal Information ── */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <EditBtn onClick={() => setEditMode(editMode === 'personal' ? null : 'personal')}>
            <Edit2 size={13} /> Edit
          </EditBtn>
        </CardHeader>

        {editMode === 'personal' ? (
          <>
            <FormGrid $cols={2}>
              <FormGroup><FormLabel>First Name</FormLabel><AdminInput value={form.firstName} onChange={upd('firstName')} /></FormGroup>
              <FormGroup><FormLabel>Last Name</FormLabel><AdminInput value={form.lastName} onChange={upd('lastName')} /></FormGroup>
              <FormGroup><FormLabel>Email address</FormLabel><AdminInput type="email" value={form.email} disabled style={{ opacity:0.6 }} /></FormGroup>
              <FormGroup><FormLabel>Phone</FormLabel><AdminInput value={form.phone} onChange={upd('phone')} placeholder="+1 234 567 890" /></FormGroup>
              <FormGroup $span={2}><FormLabel>Bio</FormLabel>
                <AdminTextarea value={form.bio} onChange={upd('bio')} style={{ minHeight:70 }} placeholder="Short bio or role description…" />
              </FormGroup>
            </FormGrid>
            <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
              <EditBtn onClick={() => setEditMode(null)}><X size={13} /> Cancel</EditBtn>
              <AdminBtn $variant="primary" onClick={save} disabled={saving}><Save size={13} /> {saving ? 'Saving…' : 'Save'}</AdminBtn>
            </div>
          </>
        ) : (
          <InfoGrid>
            <div><InfoLabel>First Name</InfoLabel><InfoValue>{form.firstName || '—'}</InfoValue></div>
            <div><InfoLabel>Last Name</InfoLabel><InfoValue>{form.lastName || '—'}</InfoValue></div>
            <div><InfoLabel>Email address</InfoLabel><InfoValue>{form.email || '—'}</InfoValue></div>
            <div><InfoLabel>Phone</InfoLabel><InfoValue>{form.phone || '—'}</InfoValue></div>
            <div style={{ gridColumn:'1/-1' }}><InfoLabel>Bio</InfoLabel><InfoValue>{form.bio || '—'}</InfoValue></div>
          </InfoGrid>
        )}
      </Card>

      {/* ── Address ── */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <EditBtn onClick={() => setEditMode(editMode === 'address' ? null : 'address')}>
            <Edit2 size={13} /> Edit
          </EditBtn>
        </CardHeader>

        {editMode === 'address' ? (
          <>
            <FormGrid $cols={2}>
              <FormGroup><FormLabel>Country</FormLabel><AdminInput value={form.country} onChange={upd('country')} placeholder="e.g. United States" /></FormGroup>
              <FormGroup><FormLabel>City / State</FormLabel><AdminInput value={form.city} onChange={upd('city')} placeholder="e.g. Phoenix, Arizona" /></FormGroup>
              <FormGroup><FormLabel>Postal Code</FormLabel><AdminInput value={form.postalCode} onChange={upd('postalCode')} placeholder="e.g. 85001" /></FormGroup>
              <FormGroup><FormLabel>TAX ID</FormLabel><AdminInput value={form.taxId} onChange={upd('taxId')} placeholder="e.g. AS4568384" /></FormGroup>
            </FormGrid>
            <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
              <EditBtn onClick={() => setEditMode(null)}><X size={13} /> Cancel</EditBtn>
              <AdminBtn $variant="primary" onClick={save} disabled={saving}><Save size={13} /> {saving ? 'Saving…' : 'Save'}</AdminBtn>
            </div>
          </>
        ) : (
          <InfoGrid>
            <div><InfoLabel>Country</InfoLabel><InfoValue>{form.country || '—'}</InfoValue></div>
            <div><InfoLabel>City / State</InfoLabel><InfoValue>{form.city || '—'}</InfoValue></div>
            <div><InfoLabel>Postal Code</InfoLabel><InfoValue>{form.postalCode || '—'}</InfoValue></div>
            <div><InfoLabel>TAX ID</InfoLabel><InfoValue>{form.taxId || '—'}</InfoValue></div>
          </InfoGrid>
        )}
      </Card>
    </PageWrap>
  );
};