import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Search } from 'lucide-react';
import { ProductCard } from '../components/ui/ProductCard';
import { PageHero } from '../components/ui/PageHero';
import { theme } from '../styles/theme';
import { Container, Section, Flex, Tag, Input, Button } from '../styles/shared';
import { useProducts } from '../hooks/useApi';

const PAGE_SIZE = 9;

const categories = ['All', 'Vegetables', 'Fruits', 'Juice', 'Dried'] as const;
const sortOptions = ['Default', 'Price: Low to High', 'Price: High to Low', 'Highest Rated'];

const ShopLayout   = styled.div`display:grid;grid-template-columns:260px 1fr;gap:40px;align-items:start;@media(max-width:${theme.breakpoints.lg}){grid-template-columns:1fr;}`;
const Sidebar      = styled.aside`position:sticky;top:20px;@media(max-width:${theme.breakpoints.lg}){display:none;}`;
const SideWidget   = styled.div`background:white;border:1px solid #f0f0f0;padding:24px;margin-bottom:24px;`;
const WidgetTitle  = styled.h3`font-size:16px;font-weight:${theme.fontWeights.medium};color:${theme.colors.textDark};text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid ${theme.colors.primary};display:inline-block;`;
const CatList      = styled.ul`li{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;&:last-child{border:none;}}`;
const CatLink      = styled.button<{$active:boolean}>`font-size:14px;color:${({$active})=>$active?theme.colors.primary:theme.colors.textDark};font-weight:${({$active})=>$active?theme.fontWeights.medium:theme.fontWeights.normal};background:none;border:none;cursor:pointer;font-family:${theme.fonts.body};transition:${theme.transitions.base};&:hover{color:${theme.colors.primary};}`;
const CatCount     = styled.span`font-size:12px;background:#f8f9fa;padding:1px 8px;border-radius:30px;color:${theme.colors.text};`;
const PriceRange   = styled.div`display:flex;gap:10px;input{width:100%;padding:8px 12px;border:1px solid #dee2e6;border-radius:4px;font-size:13px;font-family:${theme.fonts.body};outline:none;&:focus{border-color:${theme.colors.primary};}}`;
const Toolbar      = styled(Flex)`justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;`;
const ResultInfo   = styled.p`font-size:14px;color:${theme.colors.text};`;
const SortSelect   = styled.select`padding:8px 32px 8px 12px;border:1px solid #dee2e6;border-radius:4px;font-family:${theme.fonts.body};font-size:14px;color:${theme.colors.textDark};background:white;cursor:pointer;outline:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;background-size:14px;&:focus{border-color:${theme.colors.primary};}`;
const ProductsGrid = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:0 20px;@media(max-width:${theme.breakpoints.xl}){grid-template-columns:repeat(2,1fr);}@media(max-width:${theme.breakpoints.sm}){grid-template-columns:1fr;}`;
const TagRow       = styled.div`display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;@media(min-width:${theme.breakpoints.lg}){display:none;}`;
const EmptyState   = styled.div`grid-column:1/-1;text-align:center;padding:60px 20px;color:${theme.colors.text};h3{font-size:20px;margin-bottom:8px;}`;
const LoadSkeleton = styled.div`height:280px;background:linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.5s ease infinite;`;
const LoadMoreWrap = styled.div`display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:32px;`;
const LoadMoreBtn  = styled.button`padding:12px 40px;border:2px solid ${theme.colors.primary};background:transparent;color:${theme.colors.primary};font-family:${theme.fonts.body};font-size:14px;font-weight:${theme.fontWeights.medium};letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all 0.3s ease;&:hover{background:${theme.colors.primary};color:#fff;}&:disabled{opacity:0.5;cursor:not-allowed;}`;
const ShowingText  = styled.p`font-size:13px;color:${theme.colors.text};`;

const ShopPage: React.FC = () => {
  const [activeCat, setActiveCat] = useState('All');
  const [sort,      setSort]      = useState('Default');
  const [search,    setSearch]    = useState('');
  const [minPrice,  setMinPrice]  = useState('');
  const [maxPrice,  setMaxPrice]  = useState('');
  const [visible,   setVisible]   = useState(PAGE_SIZE);

  // Fetch ALL products (no category filter) → used for sidebar counts only
  const { data: allProducts } = useProducts({ limit: 200 });

  // Fetch filtered products by active category
  const apiCategory = activeCat === 'All' ? undefined : activeCat.toLowerCase();
  const { data: apiProducts, loading } = useProducts({ category: apiCategory, limit: 200 });

  // Category counts always come from the full unfiltered list
  const catCounts = useMemo(() => {
    const all = allProducts ?? [];
    const m: Record<string, number> = { All: all.length };
    all.forEach(p => {
      const k = p.category.charAt(0).toUpperCase() + p.category.slice(1);
      m[k] = (m[k] ?? 0) + 1;
    });
    return m;
  }, [allProducts]);

  // Apply client-side search, price range, and sort on top of API-filtered results
  const filtered = useMemo(() => {
    let list = [...(apiProducts ?? [])];
    if (search.trim()) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (minPrice)      list = list.filter(p => p.price >= parseFloat(minPrice));
    if (maxPrice)      list = list.filter(p => p.price <= parseFloat(maxPrice));
    switch (sort) {
      case 'Price: Low to High': list.sort((a, b) => a.price - b.price); break;
      case 'Price: High to Low': list.sort((a, b) => b.price - a.price); break;
      case 'Highest Rated':      list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    }
    return list;
  }, [apiProducts, search, minPrice, maxPrice, sort]);

  // Reset visible count whenever filters/category change
  const handleCatChange = (c: string) => {
    setActiveCat(c);
    setVisible(PAGE_SIZE);
  };
  const handleSearchChange = (v: string) => { setSearch(v);    setVisible(PAGE_SIZE); };
  const handleSortChange   = (v: string) => { setSort(v);      setVisible(PAGE_SIZE); };
  const handleMinPrice     = (v: string) => { setMinPrice(v);  setVisible(PAGE_SIZE); };
  const handleMaxPrice     = (v: string) => { setMaxPrice(v);  setVisible(PAGE_SIZE); };

  const visibleProducts = filtered.slice(0, visible);
  const hasMore         = visible < filtered.length;

  return (
    <main>
      <PageHero title="Products" breadcrumbs={[{ label: 'Products' }]} />
      <Section><Container>
        {/* Mobile category tabs */}
        <TagRow>
          {categories.map(c => (
            <Tag key={c} $active={activeCat === c} onClick={() => handleCatChange(c)}>{c}</Tag>
          ))}
        </TagRow>

        <ShopLayout>
          {/* ── Sidebar ── */}
          <Sidebar>
            <SideWidget>
              <WidgetTitle>Search</WidgetTitle>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.colors.text }} />
                <Input
                  style={{ paddingLeft: 36, borderRadius: 4 }}
                  placeholder="Search products…"
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                />
              </div>
            </SideWidget>

            <SideWidget>
              <WidgetTitle>Categories</WidgetTitle>
              <CatList>
                {categories.map(c => (
                  <li key={c}>
                    <CatLink $active={activeCat === c} onClick={() => handleCatChange(c)}>{c}</CatLink>
                    <CatCount>{catCounts[c] ?? 0}</CatCount>
                  </li>
                ))}
              </CatList>
            </SideWidget>

            <SideWidget>
              <WidgetTitle>Price Range</WidgetTitle>
              <PriceRange>
                <input type="number" placeholder="Min $" value={minPrice} onChange={e => handleMinPrice(e.target.value)} />
                <input type="number" placeholder="Max $" value={maxPrice} onChange={e => handleMaxPrice(e.target.value)} />
              </PriceRange>
              {(minPrice || maxPrice) && (
                <Button $variant="outline" style={{ marginTop: 10, padding: '6px 16px', fontSize: 12 }}
                  onClick={() => { setMinPrice(''); setMaxPrice(''); setVisible(PAGE_SIZE); }}>
                  Clear
                </Button>
              )}
            </SideWidget>
          </Sidebar>

          {/* ── Main content ── */}
          <div>
            <Toolbar as="div">
              <ResultInfo>
                Showing <strong>{loading ? '…' : Math.min(visible, filtered.length)}</strong> of{' '}
                <strong>{loading ? '…' : filtered.length}</strong> results
              </ResultInfo>
              <SortSelect value={sort} onChange={e => handleSortChange(e.target.value)}>
                {sortOptions.map(o => <option key={o}>{o}</option>)}
              </SortSelect>
            </Toolbar>

            <ProductsGrid>
              {loading
                ? [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <LoadSkeleton key={i} />)
                : filtered.length === 0
                  ? (
                    <EmptyState>
                      <h3>No products found</h3>
                      <p>Try adjusting your filters.</p>
                      <Button $variant="outline" style={{ marginTop: 16 }}
                        onClick={() => { handleCatChange('All'); setSearch(''); setMinPrice(''); setMaxPrice(''); }}>
                        Clear all filters
                      </Button>
                    </EmptyState>
                  )
                  : visibleProducts.map(p => <ProductCard key={p.id} product={p as any} />)
              }
            </ProductsGrid>

            {/* Load More */}
            {!loading && hasMore && (
              <LoadMoreWrap>
                <LoadMoreBtn onClick={() => setVisible(v => v + PAGE_SIZE)}>
                  Load More
                </LoadMoreBtn>
                <ShowingText>
                  Showing {Math.min(visible, filtered.length)} of {filtered.length} products
                </ShowingText>
              </LoadMoreWrap>
            )}
          </div>
        </ShopLayout>
      </Container></Section>
    </main>
  );
};

export default ShopPage;