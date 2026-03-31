import React, { useState } from 'react';
import { Dropdown } from '../theme-components/ui/dropdown/Dropdown';

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  const handleClick = () => {
    setIsOpen(!isOpen);
    setNotifying(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="dropdown-toggle"
        onClick={handleClick}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '1px solid var(--color-gray-200)',
          background: 'white',
          color: 'var(--color-gray-500)',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
      >
        {notifying && (
          <span
            style={{
              position: 'absolute',
              right: 2,
              top: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#fb923c',
              zIndex: 10,
            }}
          />
        )}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z" />
        </svg>
      </button>
      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div style={{ padding: '12px 16px', minWidth: 280 }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-gray-900)', marginBottom: 8 }}>
            Notifications
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>No new notifications</p>
        </div>
      </Dropdown>
    </div>
  );
};

export default NotificationDropdown;
