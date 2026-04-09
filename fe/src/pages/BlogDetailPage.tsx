import React, { useEffect } from 'react';
import { fadeUp } from '../styles/animations';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Calendar, User, Tag, ArrowLeft, BookOpen } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { theme } from '../styles/theme';
import { Container, Section } from '../styles/shared';
import { API_BASE } from '../api/client';
import { blogsApi, ApiBlogPost } from '../api/storefront';
import { useFetch } from '../hooks/useApi';
import { NewsletterSection } from '../components/ui/NewsletterSection';

// ── Animations ────────────────────────────────────────────────

// ── Styled ─────────────────────────────────────────────────────
const Layout       = styled.div`display:grid;grid-template-columns:1fr 320px;gap:48px;@media(max-width:${theme.breakpoints.lg}){grid-template-columns:1fr;}`;
const Article      = styled.article`animation:${fadeUp} 0.5s ease both;`;
const CoverWrap    = styled.div`width:100%;height:420px;border-radius:12px;overflow:hidden;margin-bottom:36px;@media(max-width:${theme.breakpoints.md}){height:260px;}`;
const CoverImg     = styled.img`width:100%;height:100%;object-fit:cover;`;
const MetaRow      = styled.div`display:flex;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:20px;`;
const MetaItem     = styled.span`display:inline-flex;align-items:center;gap:5px;font-size:13px;color:${theme.colors.text};`;
const CategoryBadge= styled.span`
  display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;
  background:#eef7e0;color:${theme.colors.primary};letter-spacing:0.3px;
`;
const PostTitle    = styled.h1`
  font-size:clamp(26px,4vw,40px);font-weight:${theme.fontWeights.semibold};
  color:${theme.colors.textDark};line-height:1.3;margin-bottom:24px;
  font-family:${theme.fonts.heading};
`;
const Divider      = styled.hr`border:none;border-top:2px solid #eef7e0;margin:28px 0;`;
const PostBody     = styled.div`
  font-size:16px;line-height:1.9;color:#444;
  p{margin-bottom:20px;}
  h2,h3{color:${theme.colors.textDark};font-weight:600;margin:32px 0 12px;}
  h2{font-size:24px;}h3{font-size:20px;}
  ul,ol{margin:0 0 20px 24px;li{margin-bottom:8px;}}
  strong{color:${theme.colors.textDark};}
  blockquote{
    border-left:4px solid ${theme.colors.primary};padding:12px 20px;
    margin:24px 0;background:#f9fdf3;border-radius:0 8px 8px 0;
    font-style:italic;color:#555;
  }
`;
const TagsRow      = styled.div`display:flex;flex-wrap:wrap;gap:8px;margin-top:32px;`;
const TagChip      = styled(Link)`
  display:inline-block;padding:5px 14px;border-radius:20px;font-size:12px;
  border:1px solid ${theme.colors.primary};color:${theme.colors.primary};
  text-decoration:none;transition:all 0.2s ease;
  &:hover{background:${theme.colors.primary};color:white;}
`;
const BackBtn      = styled(Link)`
  display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:500;
  color:${theme.colors.primary};text-decoration:none;margin-bottom:28px;
  &:hover{gap:12px;text-decoration:underline;}
`;

// Sidebar
const Sidebar      = styled.aside``;
const SideCard     = styled.div`background:white;border:1px solid #f0f0f0;border-radius:10px;padding:24px;margin-bottom:24px;`;
const SideTitle    = styled.h3`font-size:15px;font-weight:600;color:${theme.colors.textDark};margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #eef7e0;`;
const RecentPost   = styled(Link)`
  display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f5f5f5;text-decoration:none;
  &:last-child{border-bottom:none;}
  &:hover .recent-title{color:${theme.colors.primary};}
`;
const RecentThumb  = styled.img`width:60px;height:60px;object-fit:cover;border-radius:6px;flex-shrink:0;`;
const RecentThumbPh= styled.div`width:60px;height:60px;background:#eef7e0;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;`;
const RecentInfo   = styled.div`flex:1;min-width:0;`;
const RecentTitle  = styled.div`font-size:13px;font-weight:500;color:${theme.colors.textDark};line-height:1.4;margin-bottom:4px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;`;
const RecentDate   = styled.div`font-size:11px;color:${theme.colors.text};`;

// Skeleton
const SkeletonBlock= styled.div<{$h?:string;$w?:string;$r?:string}>`
  height:${p=>p.$h||'16px'};width:${p=>p.$w||'100%'};border-radius:${p=>p.$r||'4px'};
  background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
  background-size:200% 100%;animation:shimmer 1.5s infinite;100%{background-position:-200% 0;}}
  margin-bottom:10px;
`;

// 404 state
const NotFoundWrap = styled.div`
  text-align:center;padding:80px 20px;
  h2{font-size:28px;color:${theme.colors.textDark};margin-bottom:12px;}
  p{color:${theme.colors.text};margin-bottom:24px;}
`;

// ── Helper ─────────────────────────────────────────────────────
const resolveCover = (cover: string) => {
  if (!cover) return '';
  if (cover.startsWith('http') || cover.startsWith('/images')) return cover;
  return `${API_BASE}${cover}`;
};

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

// ── Component ──────────────────────────────────────────────────
const BlogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: post, loading, error } = useFetch<ApiBlogPost>(
    () => blogsApi.getOne(id!),
    [id]
  );

  // Recent posts for sidebar
  const { data: recentPosts } = useFetch<ApiBlogPost[]>(
    // Use list endpoint — returns paginated so grab data array
    async () => {
      const res = await blogsApi.list({ page: 1, limit: 5 });
      return { success: res.success, data: (res.data ?? []).filter((p: ApiBlogPost) => p.id !== id) };
    },
    [id]
  );

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [id]);

  // ── Loading ──
  if (loading) {
    return (
      <main>
        <Section style={{ paddingTop: 40 }}>
          <Container>
            <Layout>
              <Article>
                <SkeletonBlock $h="420px" $r="12px" />
                <SkeletonBlock $w="30%" $h="14px" />
                <SkeletonBlock $w="80%" $h="36px" />
                <SkeletonBlock $w="60%" $h="36px" />
                <SkeletonBlock $h="14px" />
                <SkeletonBlock $h="14px" />
                <SkeletonBlock $w="90%" $h="14px" />
                <SkeletonBlock $h="14px" />
                <SkeletonBlock $w="75%" $h="14px" />
              </Article>
              <Sidebar>
                <SideCard>
                  <SkeletonBlock $h="20px" $w="50%" />
                  {[1,2,3].map(i => <SkeletonBlock key={i} $h="60px" />)}
                </SideCard>
              </Sidebar>
            </Layout>
          </Container>
        </Section>
      </main>
    );
  }

  // ── Error / Not found ──
  if (error || !post) {
    return (
      <main>
        <Section>
          <Container>
            <NotFoundWrap>
              <BookOpen size={56} color="#82ae46" style={{ marginBottom: 16 }} />
              <h2>Blog post not found</h2>
              <p>The article you're looking for doesn't exist or has been removed.</p>
              <Link
                to="/blog"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#82ae46', color: 'white', padding: '12px 28px', borderRadius: 30, textDecoration: 'none', fontWeight: 600 }}
              >
                <ArrowLeft size={16} /> Back to Blog
              </Link>
            </NotFoundWrap>
          </Container>
        </Section>
      </main>
    );
  }

  const coverSrc = resolveCover(post.cover);
  const date = formatDate(post.publishedAt || post.createdAt);

  return (
    <main>
      <PageHero
        title={post.title}
        breadcrumbs={[{ label: 'Blog', to: '/blog' }, { label: post.title }]}
      />

      <Section>
        <Container>
          <Layout>
            {/* ── Article ── */}
            <Article>
              <BackBtn to="/blog"><ArrowLeft size={15} /> Back to Blog</BackBtn>

              {/* Cover image */}
              {coverSrc && (
                <CoverWrap>
                  <CoverImg
                    src={coverSrc}
                    alt={post.title}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </CoverWrap>
              )}

              {/* Meta */}
              <MetaRow>
                {post.category && <CategoryBadge>{post.category}</CategoryBadge>}
                <MetaItem><Calendar size={13} />{date}</MetaItem>
                <MetaItem><User size={13} />{post.author}</MetaItem>
              </MetaRow>

              {/* Title */}
              <PostTitle>{post.title}</PostTitle>
              <Divider />

              {/* Excerpt */}
              {post.excerpt && (
                <p style={{ fontSize: 17, color: '#555', fontStyle: 'italic', lineHeight: 1.8, marginBottom: 28, paddingLeft: 16, borderLeft: `3px solid ${theme.colors.primary}` }}>
                  {post.excerpt}
                </p>
              )}

              {/* Content */}
              <PostBody>
                {post.content
                  ? post.content.split('\n').map((para, i) =>
                      para.trim() ? <p key={i}>{para}</p> : null
                    )
                  : <p style={{ color: theme.colors.text }}>No content available for this post.</p>
                }
              </PostBody>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <>
                  <Divider />
                  <TagsRow>
                    <MetaItem style={{ marginRight: 4 }}><Tag size={13} /> Tags:</MetaItem>
                    {post.tags.map(tag => (
                      <TagChip key={tag} to={`/blog?tag=${encodeURIComponent(tag)}`}>{tag}</TagChip>
                    ))}
                  </TagsRow>
                </>
              )}

              {/* Back nav */}
              <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <BackBtn to="/blog"><ArrowLeft size={15} /> All Posts</BackBtn>
              </div>
            </Article>

            {/* ── Sidebar ── */}
            <Sidebar>
              {/* About box */}
              <SideCard>
                <SideTitle>About This Blog</SideTitle>
                <p style={{ fontSize: 13, color: theme.colors.text, lineHeight: 1.7 }}>
                  Vegefoods blog brings you the latest tips on healthy eating, seasonal produce, organic farming, and delicious recipes crafted by our nutrition team.
                </p>
              </SideCard>

              {/* Recent posts */}
              {recentPosts && recentPosts.length > 0 && (
                <SideCard>
                  <SideTitle>Recent Posts</SideTitle>
                  {recentPosts.slice(0, 4).map(p => (
                    <RecentPost key={p.id} to={`/blog/${p.id}`}>
                      {resolveCover(p.cover)
                        ? <RecentThumb src={resolveCover(p.cover)} alt={p.title}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <RecentThumbPh><BookOpen size={18} color="#82ae46" /></RecentThumbPh>
                      }
                      <RecentInfo>
                        <RecentTitle className="recent-title">{p.title}</RecentTitle>
                        <RecentDate>{formatDate(p.publishedAt || p.createdAt)}</RecentDate>
                      </RecentInfo>
                    </RecentPost>
                  ))}
                </SideCard>
              )}

              {/* Categories */}
              <SideCard>
                <SideTitle>Categories</SideTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Nutrition', 'Recipes', 'Lifestyle', 'Health', 'Gardening', 'Tips'].map(cat => (
                    <Link
                      key={cat}
                      to={`/blog?category=${encodeURIComponent(cat)}`}
                      style={{
                        display: 'inline-block', padding: '5px 14px', borderRadius: 20,
                        fontSize: 12, border: `1px solid ${theme.colors.primary}`,
                        color: post.category === cat ? 'white' : theme.colors.primary,
                        background: post.category === cat ? theme.colors.primary : 'transparent',
                        textDecoration: 'none', transition: 'all 0.2s',
                      }}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </SideCard>
            </Sidebar>
          </Layout>
        </Container>
      </Section>

      <NewsletterSection />
    </main>
  );
};

export default BlogDetailPage;
