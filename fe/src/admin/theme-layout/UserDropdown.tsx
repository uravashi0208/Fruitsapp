import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '../theme-components/ui/dropdown/Dropdown';
import { DropdownItem } from '../theme-components/ui/dropdown/DropdownItem';
import { useAdminDispatch, useAdminSelector, logout } from '../store';

const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAdminDispatch();
  const user = useAdminSelector((s) => s.adminAuth.user);

  const handleLogout = () => {
    dispatch(logout());
    sessionStorage.removeItem('vf_access_token');
    navigate('/admin/login');
    setIsOpen(false);
  };

  const displayName = user?.name || 'Admin';
  const displayEmail = user?.email || '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: 8,
          transition: 'background 0.15s ease',
          fontFamily: 'var(--font-outfit)',
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #465fff, #3641f5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
            fontFamily: 'var(--font-outfit)',
          }}
        >
          {initials}
        </span>
        <span
          style={{
            fontWeight: 500,
            fontSize: 14,
            color: 'var(--color-gray-700)',
            display: 'none',
          }}
          className="user-name-label"
        >
          {displayName}
        </span>
        <svg
          style={{
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            color: 'var(--color-gray-400)',
          }}
          width="16"
          height="16"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4.3125 8.65625L9 13.3437L13.6875 8.65625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className=""
      >
        <div style={{ padding: 12, minWidth: 220 }}>
          <div style={{ padding: '4px 12px 12px', borderBottom: '1px solid var(--color-gray-100)', marginBottom: 4 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-gray-900)', fontFamily: 'var(--font-outfit)' }}>
              {displayName}
            </div>
            {displayEmail && (
              <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 2 }}>
                {displayEmail}
              </div>
            )}
          </div>

          <DropdownItem
            tag="a"
            to="/admin/profile"
            onItemClick={() => setIsOpen(false)}
            className=""
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-gray-500)', flexShrink: 0 }}>
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="currentColor"/>
            </svg>
            Profile
          </DropdownItem>

          <div style={{ borderTop: '1px solid var(--color-gray-100)', marginTop: 4, paddingTop: 4 }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                color: '#f04438',
                width: '100%',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontFamily: 'var(--font-outfit)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z" fill="currentColor"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </Dropdown>
    </div>
  );
};

export default UserDropdown;
