// ============================================================
// NAVBAR — pixel-perfect match of original ftco-navbar-light
// - Top bar: bg #82ae46, font 11px uppercase letter-spacing 1px
// - Nav links: 11px, uppercase, letter-spacing 2px, padding 1.5rem
// - Transparent → white (scrolled), fixed on scroll
// - Cart CTA: green pill button
// ============================================================
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { useCart } from '../../hooks/useCart';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleMobileMenu, closeMobileMenu } from '../../store/uiSlice';
import { ShoppingCart } from 'lucide-react';



// ── Main Navbar ───────────────────────────────────────────────
const NavWrapper = styled.nav<{ $scrolled: boolean }>`
  background: ${({ $scrolled }) => $scrolled ? '#fff' : 'transparent'} !important;
  z-index: ${theme.zIndex.sticky};
  padding: 0;
  position: ${({ $scrolled }) => $scrolled ? 'fixed' : 'relative'};
  top: 0; left: 0; right: 0;
  box-shadow: ${({ $scrolled }) => $scrolled ? theme.shadows.nav : 'none'};
  transition: all 0.3s ease;

  @media (max-width: ${theme.breakpoints.lg}) {
    background: #000000 !important;
    position: relative;
    padding: 10px 15px;
  }
`;

const NavInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
  min-height: 68px;

  @media (max-width: ${theme.breakpoints.lg}) {
    min-height: 52px;
    padding: 0;
  }
`;

// Brand — font-weight 800, uppercase, green color
const Brand = styled(Link)`
  font-weight: ${theme.fontWeights.extrabold};
  font-size: ${theme.fontSizes.xl};
  text-transform: uppercase;
  color: ${theme.colors.primary};
  text-decoration: none;
  transition: ${theme.transitions.base};
  letter-spacing: 0.05em;
  flex-shrink: 0;

  &:hover { color: ${theme.colors.textDark}; text-decoration: none; }

  @media (max-width: ${theme.breakpoints.lg}) {
    color: white;
    &:hover { color: white; }
  }
`;

// Nav links list
const NavList = styled.ul<{ $open: boolean }>`
  display: flex;
  align-items: center;
  gap: 0;
  list-style: none;
  margin: 0; padding: 0;

  @media (max-width: ${theme.breakpoints.lg}) {
    position: fixed;
    top: 0; bottom: 0; right: 0;
    width: 280px;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    background: #1a1a1a;
    transform: ${({ $open }) => $open ? 'translateX(0)' : 'translateX(100%)'};
    transition: transform 0.3s ease;
    z-index: ${theme.zIndex.modal};
    padding: 60px 30px 30px;
    gap: 4px;
    box-shadow: -5px 0 20px rgba(0,0,0,0.3);
  }
`;

// Nav link — 11px, uppercase, letter-spacing 2px, padding top/bottom 1.5rem
const NavLinkStyled = styled(NavLink)<{ $scrolled: boolean }>`
  font-size: 11px;
  padding: 1.5rem 20px;
  font-weight: ${theme.fontWeights.normal};
  color: ${({ $scrolled }) => $scrolled ? '#000000' : '#000000'} !important;
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 1 !important;
  text-decoration: none;
  transition: ${theme.transitions.base};
  display: block;
  white-space: nowrap;

  &:hover { color: #000000 !important; text-decoration: none; }
  &.active { color: ${theme.colors.primary} !important; }

  @media (max-width: ${theme.breakpoints.lg}) {
    padding: 0.9rem 0;
    font-size: 14px;
    color: rgba(255,255,255,0.7) !important;
    &:hover, &.active { color: #fff !important; }
  }
`;



// Cart CTA button — green pill
const CartCta = styled(Link)<{ $scrolled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 18px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-decoration: none;
  transition: ${theme.transitions.base};
  font-weight: ${theme.fontWeights.normal};
  white-space: nowrap;

  background: ${({ $scrolled }) => $scrolled ? theme.colors.primary : 'transparent'};
  color: ${({ $scrolled }) => $scrolled ? '#fff' : '#000000'} !important;

  &:hover {
    background: ${theme.colors.primary};
    color: #fff !important;
    border-color: ${theme.colors.primary};
    text-decoration: none;
  }

  @media (max-width: ${theme.breakpoints.lg}) {
    background: ${theme.colors.primary};
    color: #fff !important;
    border: none;
    margin-top: 8px;
  }
`;

const CartCount = styled.span`font-size: 11px;`;

const MobileClose = styled.button`
  position: absolute;
  top: 16px; right: 16px;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: white;
  font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(255,255,255,0.2);
`;

const MobileOverlay = styled.div<{ $open: boolean }>`
  display: none;
  @media (max-width: ${theme.breakpoints.lg}) {
    display: ${({ $open }) => $open ? 'block' : 'none'};
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: ${theme.zIndex.modal - 1};
  }
`;

const HamburgerBtn = styled.button`
  display: none;
  @media (max-width: ${theme.breakpoints.lg}) {
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.5);
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    gap: 6px;
    padding: 4px 0;
    flex-shrink: 0;
  }
`;

const HamburgerIcon = styled.span`font-size: 20px;`;

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const dispatch = useAppDispatch();
  const mobileOpen = useAppSelector((s) => s.ui.mobileMenuOpen);
  const { totalItems } = useCart();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    dispatch(closeMobileMenu());
  }, [location, dispatch]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header>
      {/* Green top bar */}
      {/*<TopBar>
        <TopInner>
          <TopItem>
            <TopIconWrap>📞</TopIconWrap>
            + 1235 2355 98
          </TopItem>
          <TopItem>
            <TopIconWrap>✉️</TopIconWrap>
            youremail@email.com
          </TopItem>
          <TopRight>3-5 Business days delivery &amp; Free Returns</TopRight>
        </TopInner>
      </TopBar>*/}

      {/* Main navigation */}
      <NavWrapper $scrolled={scrolled} role="navigation" aria-label="Main navigation">
        <NavInner>
          <Brand to="/">Vegefoods</Brand>

          {/* Mobile overlay */}
          <MobileOverlay $open={mobileOpen} onClick={() => dispatch(closeMobileMenu())} />

          {/* Nav links */}
          <NavList $open={mobileOpen}>
            {mobileOpen && (
              <MobileClose onClick={() => dispatch(closeMobileMenu())} aria-label="Close menu">
                ✕
              </MobileClose>
            )}

            <li style={{ listStyle: 'none' }}>
              <NavLinkStyled to="/" end $scrolled={scrolled}>Home</NavLinkStyled>
            </li>

            {/*<DropdownWrap>
              <NavLinkStyled to="/shop" $scrolled={scrolled}>Shop</NavLinkStyled>
              <DropdownList>
                <li><DropdownLinkItem to="/shop">Shop</DropdownLinkItem></li>
                <li><DropdownLinkItem to="/wishlist">Wishlist</DropdownLinkItem></li>
                <li><DropdownLinkItem to="/cart">Cart</DropdownLinkItem></li>
                <li><DropdownLinkItem to="/checkout">Checkout</DropdownLinkItem></li>
              </DropdownList>
            </DropdownWrap>*/}

            <li style={{ listStyle: 'none' }}>
              <NavLinkStyled to="/shop" $scrolled={scrolled}>Shop</NavLinkStyled>
            </li>

            <li style={{ listStyle: 'none' }}>
              <NavLinkStyled to="/about" $scrolled={scrolled}>About</NavLinkStyled>
            </li>
            <li style={{ listStyle: 'none' }}>
              <NavLinkStyled to="/blog" $scrolled={scrolled}>Blog</NavLinkStyled>
            </li>
            <li style={{ listStyle: 'none' }}>
              <NavLinkStyled to="/contact" $scrolled={scrolled}>Contact</NavLinkStyled>
            </li>
          </NavList>

          {/* Cart CTA + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CartCta to="/cart" $scrolled={scrolled} aria-label={`Cart, ${totalItems} items`}>
              <ShoppingCart /> <CartCount>[{totalItems}]</CartCount>
            </CartCta>

            <HamburgerBtn
              onClick={() => dispatch(toggleMobileMenu())}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <HamburgerIcon>☰</HamburgerIcon>
              Menu
            </HamburgerBtn>
          </div>
        </NavInner>
      </NavWrapper>
    </header>
  );
};