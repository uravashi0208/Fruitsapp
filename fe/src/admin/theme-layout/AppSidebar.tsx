import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import {
  GridIcon,
  UserCircleIcon,
  ListIcon,
  TableIcon,
  PageIcon,
  PieChartIcon,
  BoxCubeIcon,
  HorizontaLDots,
  ChevronDownIcon,
  EnvelopeIcon,
  CalenderIcon
} from '../icons';
import {
  HelpCircle,Ticket, Star
} from 'lucide-react';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

const TestimonialNavIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" width={22} height={22} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 10h.01M12 10h.01M16 10h.01" />
  </svg>
);

const SliderNavIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" width={22} height={22} {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <polyline points="9 9 5 12 9 15" />
    <polyline points="15 9 19 12 15 15" />
  </svg>
);

const navItems: NavItem[] = [
  { icon: <GridIcon />, name: 'Dashboard', path: '/admin' },
  {
    icon: <BoxCubeIcon />,
    name: 'Products',
    subItems: [
      { name: 'Products List',       path: '/admin/products' },
      { name: 'Products Categories', path: '/admin/categories' },
    ],
  },
  { icon: <SliderNavIcon />,      name: 'Sliders',       path: '/admin/sliders' },
  { icon: <TableIcon />,          name: 'Orders',        path: '/admin/orders' },
  { icon: <UserCircleIcon />,     name: 'Users',         path: '/admin/users' },
  { icon: <ListIcon />,           name: 'Blogs',         path: '/admin/blogs' },
  { icon: <TestimonialNavIcon />, name: 'Testimonials',  path: '/admin/testimonials' },
  { icon: <EnvelopeIcon />,       name: 'Newsletter',    path: '/admin/newsletter' },
  { icon: <PageIcon />,           name: 'Contacts',      path: '/admin/contacts' },
  { icon: <HelpCircle />,         name: 'FAQs',          path: '/admin/FAQs' },
  { icon: <CalenderIcon />,       name: 'Calendar',      path: '/admin/calendar' },
  { icon: <Ticket />,       name: 'Coupons',      path: '/admin/coupons' },
  { icon: <Star />,       name: 'Reviews',      path: '/admin/reviews' }
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: 'More',
    subItems: [
      { name: 'Card Details', path: '/admin/cards' },
      { name: 'Wishlists', path: '/admin/wishlist' },
      { name: 'Settings', path: '/admin/settings' },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<{ type: 'main' | 'others'; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {
      if (path === '/admin') return location.pathname === '/admin';
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  const handleSubmenuToggle = (index: number, menuType: 'main' | 'others') => {
    setOpenSubmenu((prev) =>
      prev?.type === menuType && prev?.index === index ? null : { type: menuType, index }
    );
  };

  useEffect(() => {
    let submenuMatched = false;
    ['main', 'others'].forEach((menuType) => {
      const items = menuType === 'main' ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems?.some((sub) => isActive(sub.path))) {
          setOpenSubmenu({ type: menuType as 'main' | 'others', index });
          submenuMatched = true;
        }
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    Object.entries(subMenuRefs.current).forEach(([key, el]) => {
      if (el) setSubMenuHeight((prev) => ({ ...prev, [key]: el.scrollHeight }));
    });
  }, [openSubmenu]);

  const isShowingFull = isExpanded || isHovered || isMobileOpen;

  const renderMenuItems = (items: NavItem[], menuType: 'main' | 'others') => (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              className={`menu-item ${nav.subItems.some((s) => isActive(s.path)) ? 'menu-item-active' : 'menu-item-inactive'}`}
              style={{ justifyContent: isShowingFull ? 'flex-start' : 'center' }}
              onClick={() => handleSubmenuToggle(index, menuType)}
            >
              <span className={`menu-item-icon-size ${nav.subItems.some((s) => isActive(s.path)) ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`}>
                {nav.icon}
              </span>
              {isShowingFull && <span className="menu-item-text">{nav.name}</span>}
              {isShowingFull && (
                <ChevronDownIcon
                  style={{
                    marginLeft: 'auto',
                    width: 16,
                    height: 16,
                    transition: 'transform 0.2s ease',
                    transform: openSubmenu?.type === menuType && openSubmenu?.index === index ? 'rotate(180deg)' : 'none',
                    color: 'var(--color-gray-400)',
                  }}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <NavLink
                to={nav.path}
                end={nav.path === '/admin'}
                className={({ isActive: active }) => `menu-item ${active ? 'menu-item-active' : 'menu-item-inactive'}`}
                style={{ justifyContent: isShowingFull ? 'flex-start' : 'center' }}
              >
                <span className={`menu-item-icon-size ${isActive(nav.path) ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`}>
                  {nav.icon}
                </span>
                {isShowingFull && <span className="menu-item-text">{nav.name}</span>}
              </NavLink>
            )
          )}

          {nav.subItems && isShowingFull && (
            <div
              ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
              style={{
                overflow: 'hidden',
                transition: 'height 0.3s ease',
                height: openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? `${subMenuHeight[`${menuType}-${index}`] || 0}px`
                  : '0px',
              }}
            >
              <ul style={{ marginTop: 4, marginLeft: 28, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <NavLink
                      to={subItem.path}
                      className={({ isActive: active }) =>
                        `menu-dropdown-item ${active ? 'menu-dropdown-item-active' : 'menu-dropdown-item-inactive'}`
                      }
                    >
                      {subItem.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className="admin-sidebar-bg"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: isExpanded || isHovered || isMobileOpen ? '290px' : '90px',
        background: 'white',
        borderRight: '1px solid var(--color-gray-200)',
        transition: 'width 0.3s ease, transform 0.3s ease',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        transform: isMobileOpen ? 'translateX(0)' : window.innerWidth < 1024 ? 'translateX(-100%)' : 'translateX(0)',
        paddingLeft: 20,
        paddingRight: 20,
      }}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        style={{
          padding: '28px 0',
          display: 'flex',
          justifyContent: isShowingFull ? 'flex-start' : 'center',
          borderBottom: '1px solid var(--color-gray-100)',
          marginBottom: 8,
        }}
      >
        {isShowingFull ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #465fff, #3641f5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: 14,
                fontFamily: 'var(--font-outfit)',
                letterSpacing: -0.5,
              }}
            >
              VF
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-gray-900)', letterSpacing: -0.3, fontFamily: 'var(--font-outfit)' }}>
                Vegefoods
              </div>
              <div style={{ fontWeight: 600, fontSize: 10, color: 'var(--color-brand-500)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Admin Panel
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #465fff, #3641f5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            VF
          </div>
        )}
      </div>

      {/* Nav */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 24 }}
      >
        <nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Main Menu */}
            <div>
              <h2
                style={{
                  marginBottom: 12,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  fontWeight: 600,
                  color: 'var(--color-gray-400)',
                  display: 'flex',
                  justifyContent: isShowingFull ? 'flex-start' : 'center',
                }}
              >
                {isShowingFull ? 'Menu' : <HorizontaLDots style={{ width: 20, height: 20 }} />}
              </h2>
              {renderMenuItems(navItems, 'main')}
            </div>

            {/* Others */}
            <div>
              <h2
                style={{
                  marginBottom: 12,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  fontWeight: 600,
                  color: 'var(--color-gray-400)',
                  display: 'flex',
                  justifyContent: isShowingFull ? 'flex-start' : 'center',
                }}
              >
                {isShowingFull ? 'Others' : <HorizontaLDots style={{ width: 20, height: 20 }} />}
              </h2>
              {renderMenuItems(othersItems, 'others')}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
