/**
 * src/pages/FaqPage.tsx
 * Public-facing FAQ page with category filtering and accordion UI
 */
import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { Plus, Minus, HelpCircle, Search } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { Container, Section } from '../styles/shared';
import { theme } from '../styles/theme';
import { faqApi, ApiFaq } from '../api/storefront';

// ── Animations ─────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); }`;

// ── Styled components ──────────────────────────────────────────────────────────
const FaqSection = styled(Section)`
  background: ${theme.colors.bgColor5};
  padding: 4em 0;
`;

const FaqLayout = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 40px;
  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

/* ── Sidebar ── */
const Sidebar = styled.aside``;

const SidebarTitle = styled.h3`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${theme.colors.textMuted};
  margin-bottom: 12px;
`;

const CategoryList = styled.ul`list-style: none; padding: 0; margin: 0 0 32px;`;

const CategoryItem = styled.li<{ $active?: boolean }>`
  margin-bottom: 4px;
  button {
    width: 100%;
    text-align: left;
    background: ${({ $active }) => $active ? theme.colors.primary : 'transparent'};
    color: ${({ $active }) => $active ? 'white' : theme.colors.textDark};
    border: none;
    padding: 9px 14px;
    border-radius: 6px;
    font-size: 14px;
    font-family: ${theme.fonts.body};
    font-weight: ${({ $active }) => $active ? 600 : 400};
    cursor: pointer;
    transition: ${theme.transitions.fast};
    display: flex;
    align-items: center;
    justify-content: space-between;
    &:hover {
      background: ${({ $active }) => $active ? theme.colors.primary : `${theme.colors.primary}15`};
      color: ${({ $active }) => $active ? 'white' : theme.colors.primary};
    }
  }
`;

const CountBadge = styled.span<{ $active?: boolean }>`
  font-size: 11px;
  font-weight: 600;
  background: ${({ $active }) => $active ? 'rgba(255,255,255,0.25)' : `${theme.colors.primary}20`};
  color: ${({ $active }) => $active ? 'rgba(255,255,255,0.9)' : theme.colors.primary};
  padding: 2px 7px;
  border-radius: 20px;
`;

const SearchWrap = styled.div`
  position: relative;
  margin-bottom: 24px;
  svg {
    position: absolute;
    left: 12px; top: 50%;
    transform: translateY(-50%);
    color: ${theme.colors.textMuted};
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid ${theme.colors.borderMid};
  border-radius: 6px;
  font-family: ${theme.fonts.body};
  font-size: 14px;
  color: ${theme.colors.textDark};
  background: white;
  transition: ${theme.transitions.fast};
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primaryGhost};
  }
  &::placeholder { color: ${theme.colors.textMuted}; }
`;

/* ── Main content ── */
const FaqMain = styled.div``;

const CategorySection = styled.div`
  margin-bottom: 36px;
  animation: ${fadeIn} 0.25s ease;
`;

const CategoryHeading = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.textDark};
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid ${theme.colors.primary};
  display: inline-block;
`;

const AccordionItem = styled.div<{ $open: boolean }>`
  background: white;
  border: 1px solid ${({ $open }) => $open ? `${theme.colors.primary}60` : theme.colors.border};
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: ${({ $open }) => $open ? `0 4px 16px ${theme.colors.primary}15` : 'none'};
`;

const AccordionTrigger = styled.button<{ $open: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  background: ${({ $open }) => $open ? `${theme.colors.primary}08` : 'white'};
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: ${theme.fonts.body};
  transition: background 0.15s;
  &:hover { background: ${theme.colors.primary}10; }
`;

const QuestionText = styled.span<{ $open: boolean }>`
  font-size: 15px;
  font-weight: ${({ $open }) => $open ? 600 : 500};
  color: ${({ $open }) => $open ? theme.colors.primary : theme.colors.textDark};
  flex: 1;
  line-height: 1.5;
  transition: color 0.2s;
`;

const IconWrap = styled.span<{ $open: boolean }>`
  flex-shrink: 0;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: ${({ $open }) => $open ? theme.colors.primary : `${theme.colors.primary}15`};
  color: ${({ $open }) => $open ? 'white' : theme.colors.primary};
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
`;

const AnswerPanel = styled.div<{ $open: boolean }>`
  max-height: ${({ $open }) => $open ? '600px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const AnswerContent = styled.div`
  padding: 0 20px 20px 20px;
  font-size: 14px;
  color: ${theme.colors.text};
  line-height: 1.8;
  white-space: pre-wrap;
  border-top: 1px solid ${theme.colors.border};
  padding-top: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  border: 1px dashed ${theme.colors.borderMid};
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Skeleton = styled.div`
  height: 60px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: shimmer 1.2s infinite;
  @keyframes shimmer { to { background-position: -200% 0; } }
`;

/* ── Contact CTA ── */
const ContactCta = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  margin-top: 40px;
`;

const CtaTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${theme.colors.textDark};
`;

const CtaText = styled.p`
  font-size: 14px;
  color: ${theme.colors.text};
  margin-bottom: 20px;
`;

const CtaBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${theme.colors.primary};
  color: white;
  padding: 12px 28px;
  border-radius: ${theme.radii.lg};
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: ${theme.transitions.fast};
  font-family: ${theme.fonts.body};
  &:hover { background: ${theme.colors.primaryDark}; transform: translateY(-1px); }
`;

// ── Component ──────────────────────────────────────────────────────────────────
export const FaqPage: React.FC = () => {
  const [faqs,     setFaqs]     = useState<ApiFaq[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    faqApi.list()
      .then(res => { if (res.success) setFaqs(res.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Unique categories in sort order
  const categories = useMemo(() => {
    return Array.from(new Set(faqs.map(f => f.category).filter(Boolean))).sort() as string[];
  }, [faqs]);

  // Filtered faqs
  const filtered = useMemo(() => {
    let list = faqs;
    if (catFilter) list = list.filter(f => f.category === catFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(f =>
        f.question.toLowerCase().includes(s) || f.answer.toLowerCase().includes(s)
      );
    }
    return list;
  }, [faqs, catFilter, search]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, ApiFaq[]>();
    for (const faq of filtered) {
      const cat = faq.category || 'General';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(faq);
    }
    return map;
  }, [filtered]);

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const faq of faqs) {
      const cat = faq.category || 'General';
      map[cat] = (map[cat] ?? 0) + 1;
    }
    return map;
  }, [faqs]);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <main>
      <PageHero
        title="Frequently Asked Questions"
        breadcrumbs={[{ label: 'FAQs' }]}
      />

      <FaqSection>
        <Container>
          <FaqLayout>
            {/* ── Sidebar ── */}
            <Sidebar>
              <SearchWrap>
                <Search size={15} />
                <SearchInput
                  placeholder="Search FAQs…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setExpanded(null); }}
                />
              </SearchWrap>

              <SidebarTitle>Categories</SidebarTitle>
              <CategoryList>
                <CategoryItem $active={catFilter === ''}>
                  <button onClick={() => { setCatFilter(''); setExpanded(null); }}>
                    <span>All Questions</span>
                    <CountBadge $active={catFilter === ''}>{faqs.length}</CountBadge>
                  </button>
                </CategoryItem>
                {categories.map(cat => (
                  <CategoryItem key={cat} $active={catFilter === cat}>
                    <button onClick={() => { setCatFilter(catFilter === cat ? '' : cat); setExpanded(null); }}>
                      <span>{cat}</span>
                      <CountBadge $active={catFilter === cat}>{countByCategory[cat] ?? 0}</CountBadge>
                    </button>
                  </CategoryItem>
                ))}
              </CategoryList>

              <ContactCta>
                <HelpCircle size={32} style={{ color: theme.colors.primary, marginBottom: 12 }} />
                <CtaTitle>Still need help?</CtaTitle>
                <CtaText>Our support team is ready to answer your questions.</CtaText>
                <CtaBtn href="/contact">Contact Us</CtaBtn>
              </ContactCta>
            </Sidebar>

            {/* ── FAQ Content ── */}
            <FaqMain>
              {loading ? (
                <LoadingState>
                  {[...Array(6)].map((_, i) => <Skeleton key={i} />)}
                </LoadingState>
              ) : grouped.size === 0 ? (
                <EmptyState>
                  <HelpCircle size={48} style={{ color: theme.colors.textMuted, marginBottom: 16 }} />
                  <h3 style={{ fontSize: 18, marginBottom: 8, color: theme.colors.textDark }}>
                    {search ? 'No results found' : 'No FAQs yet'}
                  </h3>
                  <p style={{ color: theme.colors.text, fontSize: 14 }}>
                    {search ? `Try a different search term` : 'Check back soon.'}
                  </p>
                </EmptyState>
              ) : (
                Array.from(grouped.entries()).map(([cat, items]) => (
                  <CategorySection key={cat}>
                    {(!catFilter || grouped.size > 1) && (
                      <CategoryHeading>{cat}</CategoryHeading>
                    )}
                    {items.map((faq: ApiFaq) => (
                      <AccordionItem key={faq.id} $open={expanded === faq.id}>
                        <AccordionTrigger
                          $open={expanded === faq.id}
                          onClick={() => toggle(faq.id)}
                          aria-expanded={expanded === faq.id}
                        >
                          <QuestionText $open={expanded === faq.id}>
                            {faq.question}
                          </QuestionText>
                          <IconWrap $open={expanded === faq.id}>
                            {expanded === faq.id
                              ? <Minus size={14} />
                              : <Plus size={14} />}
                          </IconWrap>
                        </AccordionTrigger>
                        <AnswerPanel $open={expanded === faq.id}>
                          <AnswerContent>{faq.answer}</AnswerContent>
                        </AnswerPanel>
                      </AccordionItem>
                    ))}
                  </CategorySection>
                ))
              )}
            </FaqMain>
          </FaqLayout>
        </Container>
      </FaqSection>

      <NewsletterSection />
    </main>
  );
};

export default FaqPage;
