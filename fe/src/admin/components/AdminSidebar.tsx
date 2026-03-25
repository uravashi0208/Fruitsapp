import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  CreditCard, MessageSquare, FileText, Settings,
  ChevronLeft, ChevronRight, Heart, LogOut, Tag,
  ChevronDown, ChevronUp, List,
} from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import { useAdminDispatch, useAdminSelector, toggleSidebar, logout } from '../store';


const Aside = styled.aside<{ $w: string }>`
  position: fixed; top: 0; left: 0; height: 100vh;
  width: ${({ $w }) => $w};
  background: ${t.colors.sidebarBg};
  border-right: 1px solid ${t.colors.sidebarBorder};
  display: flex; flex-direction: column;
  transition: width 0.25s cubic-bezier(0.25,0.46,0.45,0.94);
  z-index: ${t.zIndex.sidebar};
  overflow: hidden;
`;

const LogoWrap = styled.div<{ $c: boolean }>`
  display: flex; align-items: center;
  gap: 10px;
  padding: ${({ $c }) => $c ? '1.25rem 1.4rem' : '1.25rem 1.5rem'};
  min-height: 72px;
  border-bottom: 1px solid ${t.colors.sidebarBorder};
  justify-content: ${({ $c }) => $c ? 'center' : 'flex-start'};
  transition: padding 0.25s ease;
  overflow: hidden;
`;

const LogoIcon = styled.div`
  width: 36px; height: 36px;
  border-radius: 10px;
  background: ${t.colors.primary};
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
  font-weight: 800; font-size: 1rem;
  letter-spacing: -1px;
  font-family: ${t.fonts.heading};
`;

const LogoText = styled.div`
  overflow: hidden;
  div:first-child { font-size: 1rem; font-weight: 700; color: ${t.colors.textPrimary}; white-space: nowrap; letter-spacing: -0.3px; }
  div:last-child  { font-size: 0.625rem; font-weight: 600; color: ${t.colors.primary}; letter-spacing: 1.5px; text-transform: uppercase; }
`;

const NavScroll = styled.nav`
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 1rem 0;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: ${t.colors.border}; border-radius: 99px; }
`;

const SectionLabel = styled.p<{ $c: boolean }>`
  font-size: 0.65rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1.2px;
  color: ${t.colors.textMuted};
  padding: ${({ $c }) => $c ? '0.75rem 0' : '0.75rem 1.5rem 0.35rem'};
  ${({ $c }) => $c && 'text-align:center;'}
  white-space: nowrap;
  display: ${({ $c }) => $c ? 'none' : 'block'};
`;

const Item = styled(NavLink)<{ $c: boolean }>`
  display: flex; align-items: center;
  gap: 10px;
  padding: ${({ $c }) => $c ? '0.65rem' : '0.6rem 1.25rem'};
  justify-content: ${({ $c }) => $c ? 'center' : 'flex-start'};
  text-decoration: none;
  color: ${t.colors.sidebarText};
  font-size: 0.875rem; font-weight: 500;
  border-radius: 10px;
  margin: 1px 8px;
  transition: all 0.15s ease;
  position: relative;
  white-space: nowrap;
  svg { flex-shrink: 0; width: 20px; height: 20px; opacity: 0.7; transition: opacity 0.15s; }
  &:hover { background: ${t.colors.sidebarHover}; color: ${t.colors.textPrimary}; svg { opacity: 1; } }
  &.active { background: rgba(70,95,255,0.08); color: ${t.colors.primary}; font-weight: 600; svg { opacity: 1; color: ${t.colors.primary}; } }
`;

/* Dropdown parent button (not a NavLink) */
const ParentBtn = styled.button<{ $c: boolean; $active: boolean }>`
  display: flex; align-items: center;
  gap: 10px;
  padding: ${({ $c }) => $c ? '0.65rem' : '0.6rem 1.25rem'};
  justify-content: ${({ $c }) => $c ? 'center' : 'flex-start'};
  width: 100%;
  background: ${({ $active }) => $active ? 'rgba(70,95,255,0.08)' : 'none'};
  color: ${({ $active }) => $active ? t.colors.primary : t.colors.sidebarText};
  font-size: 0.875rem; font-weight: ${({ $active }) => $active ? 600 : 500};
  border: none; border-radius: 10px;
  margin: 1px 8px; width: calc(100% - 16px);
  cursor: pointer; transition: all 0.15s ease;
  white-space: nowrap;
  svg { flex-shrink: 0; width: 20px; height: 20px; opacity: 0.7; transition: opacity 0.15s; }
  &:hover { background: ${t.colors.sidebarHover}; color: ${t.colors.textPrimary}; svg { opacity: 1; } }
`;

const NavLabel = styled.span<{ $c: boolean }>`
  opacity: ${({ $c }) => $c ? 0 : 1};
  max-width: ${({ $c }) => $c ? 0 : '160px'};
  overflow: hidden;
  transition: opacity 0.2s, max-width 0.25s;
  flex: 1;
`;


const SubMenu = styled.div<{ $open: boolean }>`
  overflow: hidden;
  max-height: ${({ $open }) => $open ? '200px' : '0'};
  transition: max-height 0.25s ease;
`;

const SubItem = styled(NavLink)<{ $c: boolean }>`
  display: flex; align-items: center;
  gap: 8px;
  padding: ${({ $c }) => $c ? '0.5rem' : '0.5rem 1.25rem 0.5rem 3rem'};
  justify-content: ${({ $c }) => $c ? 'center' : 'flex-start'};
  text-decoration: none;
  color: ${t.colors.sidebarText};
  font-size: 0.8125rem; font-weight: 400;
  border-radius: 8px;
  margin: 1px 8px;
  transition: all 0.15s ease;
  white-space: nowrap;
  svg { flex-shrink: 0; width: 16px; height: 16px; opacity: 0.6; }
  &:hover { background: ${t.colors.sidebarHover}; color: ${t.colors.textPrimary}; svg { opacity: 1; } }
  &.active { background: rgba(70,95,255,0.06); color: ${t.colors.primary}; font-weight: 600; svg { opacity: 1; color: ${t.colors.primary}; } }
`;

const Bottom = styled.div`border-top: 1px solid ${t.colors.sidebarBorder}; padding: 0.75rem 0;`;
const UserRow = styled.div<{ $c: boolean }>`
  display: flex; align-items: center; gap: 10px;
  padding: ${({ $c }) => $c ? '0.65rem 0' : '0.65rem 1.25rem'};
  justify-content: ${({ $c }) => $c ? 'center' : 'flex-start'};
  overflow: hidden; margin: 0 8px;
`;
const UserAvatar = styled.div`
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg,${t.colors.primary},${t.colors.primaryDark});
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
  border: 2px solid rgba(70,95,255,0.2);
`;
const UserInfo = styled.div<{ $c: boolean }>`
  flex: 1; min-width: 0;
  opacity: ${({ $c }) => $c ? 0 : 1};
  max-width: ${({ $c }) => $c ? 0 : '120px'};
  overflow: hidden; transition: opacity 0.2s, max-width 0.25s;
`;
const UserName = styled.div`font-size: 0.8125rem; font-weight: 600; color: ${t.colors.textPrimary}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;
const UserRole = styled.div`font-size: 0.7rem; color: ${t.colors.textMuted}; white-space: nowrap;`;
const LogoutBtn = styled.button<{ $c: boolean }>`
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: ${({ $c }) => $c ? '0.6rem' : '0.6rem 1.25rem'};
  justify-content: ${({ $c }) => $c ? 'center' : 'flex-start'};
  background: none; border: none; color: ${t.colors.textMuted};
  font-size: 0.875rem; font-weight: 500; cursor: pointer;
  transition: all 0.15s ease; border-radius: 10px; margin: 2px 8px;
  svg { flex-shrink: 0; width: 18px; height: 18px; opacity: 0.6; }
  &:hover { background: #fef3f2; color: #f04438; svg { opacity: 1; } }
`;
const CollapseBtn = styled.button`
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 0.6rem;
  background: none; border: none; border-top: 1px solid ${t.colors.sidebarBorder};
  color: ${t.colors.textMuted}; cursor: pointer;
  transition: all 0.15s ease;
  &:hover { color: ${t.colors.textPrimary}; background: ${t.colors.surfaceAlt}; }
`;

export const AdminSidebar: React.FC = () => {
  const dispatch  = useAdminDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const collapsed = useAdminSelector(s => s.adminUI.sidebarCollapsed);
  const user      = useAdminSelector(s => s.adminAuth.user);
  const w         = collapsed ? t.sidebar.collapsedWidth : t.sidebar.width;

  // Products dropdown open state
  const productPaths = ['/admin/products', '/admin/categories'];
  const isProductActive = productPaths.some(p => location.pathname.startsWith(p));
  const [productOpen, setProductOpen] = useState(isProductActive);

  return (
    <Aside $w={w}>
      {/* Logo */}
      <LogoWrap $c={collapsed}>
        <LogoIcon>VF</LogoIcon>
        {!collapsed && (
          <LogoText>
            <div>Vegefoods</div>
            <div>Admin Panel</div>
          </LogoText>
        )}
      </LogoWrap>

      {/* Nav */}
      <NavScroll>
        <SectionLabel $c={collapsed}>MENU</SectionLabel>

        {/* Dashboard */}
        <Item to="/admin" end $c={collapsed}>
          <LayoutDashboard />
          <NavLabel $c={collapsed}>Dashboard</NavLabel>
        </Item>

        {/* Products — dropdown */}
        <ParentBtn
          $c={collapsed}
          $active={isProductActive}
          onClick={() => { if (collapsed) navigate('/admin/products'); else setProductOpen(o => !o); }}
          title={collapsed ? 'Products' : undefined}
        >
          <Package />
          <NavLabel $c={collapsed}>Products</NavLabel>
          {!collapsed && (productOpen ? <ChevronUp size={14} style={{marginLeft:'auto',flexShrink:0}} /> : <ChevronDown size={14} style={{marginLeft:'auto',flexShrink:0}} />)}
        </ParentBtn>
        <SubMenu $open={productOpen && !collapsed}>
          <SubItem to="/admin/products" $c={collapsed}>
            <List /><span>Product List</span>
          </SubItem>
          <SubItem to="/admin/categories" $c={collapsed}>
            <Tag /><span>Product Categories</span>
          </SubItem>
        </SubMenu>

        {/* Orders */}
        <Item to="/admin/orders" $c={collapsed}>
          <ShoppingCart />
          <NavLabel $c={collapsed}>Orders</NavLabel>
        </Item>

        {/* Users */}
        <Item to="/admin/users" $c={collapsed}>
          <Users />
          <NavLabel $c={collapsed}>Users</NavLabel>
        </Item>

        <SectionLabel $c={collapsed}>DATA</SectionLabel>

        <Item to="/admin/cards" $c={collapsed}>
          <CreditCard />
          <NavLabel $c={collapsed}>Card Details</NavLabel>
        </Item>

        <Item to="/admin/blogs" $c={collapsed}>
          <FileText />
          <NavLabel $c={collapsed}>Blog</NavLabel>
        </Item>

        <Item to="/admin/contacts" $c={collapsed}>
          <MessageSquare />
          <NavLabel $c={collapsed}>Contacts</NavLabel>
        </Item>

        <Item to="/admin/wishlist" $c={collapsed}>
          <Heart />
          <NavLabel $c={collapsed}>Wishlists</NavLabel>
        </Item>

        <SectionLabel $c={collapsed}>SYSTEM</SectionLabel>

        <Item to="/admin/settings" $c={collapsed}>
          <Settings />
          <NavLabel $c={collapsed}>Settings</NavLabel>
        </Item>
      </NavScroll>

      {/* Bottom */}
      <Bottom>
        <UserRow $c={collapsed}>
          <UserAvatar>{user?.name?.split(' ').map(n => n[0]).join('').slice(0,2) ?? 'AD'}</UserAvatar>
          <UserInfo $c={collapsed}>
            <UserName>{user?.name ?? 'Admin'}</UserName>
            <UserRole>{user?.role ?? 'admin'}</UserRole>
          </UserInfo>
        </UserRow>
        <LogoutBtn $c={collapsed} onClick={() => { dispatch(logout()); navigate('/admin/login'); }} title={collapsed ? 'Logout' : undefined}>
          <LogOut />
          <NavLabel $c={collapsed}>Logout</NavLabel>
        </LogoutBtn>
        <CollapseBtn onClick={() => dispatch(toggleSidebar())} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </CollapseBtn>
      </Bottom>
    </Aside>
  );
};
