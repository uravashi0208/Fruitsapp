import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ShoppingCart, Trash2, Calendar, User, ArrowRight as Arrow, MapPin, Phone as PhoneIcon, Mail as MailIcon, Send, Loader } from 'lucide-react';
import { PageHero } from '../components/ui/PageHero';
import { useWishlist, useCart } from '../hooks/useCart';
import { theme } from '../styles/theme';
import { Container, Section, Flex, Button, Input } from '../styles/shared';
import { useAppDispatch } from '../store';
import { showToast } from '../store/uiSlice';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import { TestimonialsSection } from '../components/ui/TestimonialsSection';
import { FeaturesSection } from '../components/ui/FeaturesSection';
import { contactApi } from '../api/storefront';
import { ApiError, API_BASE } from '../api/client';
import { useBlogs } from '../hooks/useApi';

/* ── Wishlist ─────────────────────────────────────────────────── */
const WishGrid = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:0 20px;@media(max-width:${theme.breakpoints.lg}){grid-template-columns:repeat(3,1fr);}@media(max-width:${theme.breakpoints.md}){grid-template-columns:repeat(2,1fr);}@media(max-width:${theme.breakpoints.sm}){grid-template-columns:1fr;}`;
const WishCard  = styled.div`border:1px solid #f0f0f0;background:white;margin-bottom:30px;overflow:hidden;transition:${theme.transitions.base};&:hover{box-shadow:0 5px 20px rgba(0,0,0,0.1);}`;
const WishImg   = styled.img`width:100%;height:200px;object-fit:cover;display:block;`;
const WishBody  = styled.div`padding:16px;`;
const WishName  = styled.h3`font-size:16px;font-weight:${theme.fontWeights.medium};color:${theme.colors.textDark};margin-bottom:4px;`;
const WishPrice = styled.p`font-size:18px;font-weight:${theme.fontWeights.bold};color:${theme.colors.primary};margin-bottom:12px;`;

export const WishlistPage: React.FC = () => {
  const { items, toggle } = useWishlist();
  const { addItem } = useCart();
  return (
    <main>
      <PageHero title="My Wishlist" breadcrumbs={[{label:'Wishlist'}]}/>
      <Section><Container>
        {items.length===0?(
          <div style={{textAlign:'center',padding:'80px 20px',background:'white',border:'1px solid #f0f0f0'}}>
            <div style={{fontSize:60,marginBottom:16}}>🤍</div>
            <h2 style={{fontSize:24,marginBottom:12}}>Your wishlist is empty</h2>
            <p style={{color:theme.colors.text,marginBottom:24}}>Save products you love.</p>
            <Button as={Link as any} to="/shop">Browse Products</Button>
          </div>
        ):(
          <WishGrid>
            {items.map(item=>(
              <WishCard key={item.id}>
                <WishImg src={item.image} alt={item.name} onError={e=>{(e.target as HTMLImageElement).src=`https://placehold.co/300x200/f1f8f1/82ae46?text=${encodeURIComponent(item.name)}`;}}/>
                <WishBody>
                  <WishName>{item.name}</WishName>
                  <WishPrice>${item.price.toFixed(2)}</WishPrice>
                  <Flex as="div" $gap="8px">
                    <Button $variant="primary" style={{flex:1,padding:'8px',fontSize:12}} onClick={()=>addItem(item)}><ShoppingCart size={13}/> Add to Cart</Button>
                    <Button $variant="outline" style={{padding:'8px 12px'}} onClick={()=>toggle(item)}><Trash2 size={13}/></Button>
                  </Flex>
                </WishBody>
              </WishCard>
            ))}
          </WishGrid>
        )}
      </Container></Section>
    </main>
  );
};

/* ── About ─────────────────────────────────────────────────────── */
export const AboutPage: React.FC = () => (
  <main>
    <PageHero title="About Us" breadcrumbs={[{label:'About Us'}]}/>
    <Section style={{padding:'0px 4em',background:theme.colors.bgColor5}}>
      <Container>
        <Flex as="div" $gap="60px" $wrap style={{alignItems:'center'}}>
          <img src="/images/about.jpg" alt="About Vegefoods" style={{flex:1,maxWidth:460,minHeight:570,objectFit:'cover',width:'100%'}} onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/560x400/f1f8f1/82ae46?text=About';}}/>
          <div style={{flex:1,minWidth:280}}>
            <h2 style={{fontSize:36,marginBottom:16,fontWeight:theme.fontWeights.semibold}}>Fresh From Farm to Your Table</h2>
            <p style={{color:theme.colors.text,marginBottom:12}}>Founded in 2018, Vegefoods started as a small farm stall with a big dream — to make fresh, organic produce accessible to everyone. We partner with over 50 certified organic farms across California.</p>
            <p style={{color:theme.colors.text,marginBottom:24}}>Every item is hand-selected, cold-stored, and delivered within 24 hours of harvest. We believe healthy eating shouldn't be a luxury — it should be a joy.</p>
            <Button as={Link as any} to="/shop">Shop Now</Button>
          </div>
        </Flex>
      </Container>
    </Section>
    <NewsletterSection/>
    <TestimonialsSection count={3}/>
    <Section style={{padding:'0px',background:theme.colors.bgColor5}}><FeaturesSection/></Section>
  </main>
);

/* ── Blog ──────────────────────────────────────────────────────── */
const BlogGrid = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:30px;@media(max-width:${theme.breakpoints.lg}){grid-template-columns:repeat(2,1fr);}@media(max-width:${theme.breakpoints.sm}){grid-template-columns:1fr;}`;
const BlogCard  = styled.div`background:white;border:1px solid #f0f0f0;overflow:hidden;transition:${theme.transitions.base};&:hover{box-shadow:0 5px 20px rgba(0,0,0,0.1);}&:hover .blog-img{transform:scale(1.05);}`;
const BlogImgWrap=styled.div`overflow:hidden;height:220px;`;
const BlogImg   = styled.img`width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.4s ease;`;
const BlogBody  = styled.div`padding:20px;`;
const BlogMeta  = styled.div`display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:${theme.colors.text};margin-bottom:10px;`;
const BlogTitle = styled.h3`font-size:18px;font-weight:${theme.fontWeights.medium};margin-bottom:8px;a{color:${theme.colors.textDark};text-decoration:none;transition:${theme.transitions.base};&:hover{color:${theme.colors.primary};}}`;
const ReadMore  = styled(Link)`display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:${theme.fontWeights.medium};color:${theme.colors.primary};text-decoration:none;transition:gap 0.2s ease;&:hover{gap:10px;}`;

// Resolve blog cover image (local /uploads/... or external URL)
const resolveCover = (cover: string) => {
  if (!cover) return 'https://placehold.co/600x220/f1f8f1/82ae46?text=Blog';
  if (cover.startsWith('http') || cover.startsWith('/images')) return cover;
  return `${API_BASE}${cover}`;
};

// Skeleton card
const SkeletonCard = styled.div`background:white;border:1px solid #f0f0f0;overflow:hidden;`;
const SkeletonImg  = styled.div`height:220px;background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;`;
const SkeletonLine = styled.div<{$w?:string;$h?:string}>`height:${({$h})=>$h||'12px'};width:${({$w})=>$w||'100%'};background:#f0f0f0;border-radius:4px;margin-bottom:8px;`;

// Pagination
const PaginationWrap = styled.div`display:flex;align-items:center;justify-content:center;gap:8px;margin-top:48px;padding-bottom:16px;flex-wrap:wrap;`;
const PageBtn = styled.button<{$active?:boolean}>`
  width:40px;height:40px;border-radius:8px;
  border:1px solid ${({$active})=>$active?'#82ae46':'#dee2e6'};
  background:${({$active})=>$active?'#82ae46':'white'};
  color:${({$active})=>$active?'white':'#555'};
  font-size:14px;font-weight:${({$active})=>$active?600:400};
  cursor:pointer;transition:all 0.2s ease;
  &:hover:not(:disabled){background:${({$active})=>$active?'#6e9a35':'#f1f8f1'};border-color:#82ae46;}
  &:disabled{opacity:0.4;cursor:not-allowed;}
`;
const PageArrow = styled(PageBtn)`width:auto;padding:0 16px;font-size:13px;`;

const BLOG_PAGE_SIZE = 9;

export const BlogPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data: posts, loading, pagination } = useBlogs({ page, limit: BLOG_PAGE_SIZE });

  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);

  const totalPages = pagination.totalPages;

  const getPageNums = () => {
    if (totalPages <= 7) return Array.from({length: totalPages}, (_, i) => i + 1);
    const pages: (number|string)[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page-1); i <= Math.min(totalPages-1, page+1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <main>
      <PageHero title="Our Blog" breadcrumbs={[{label:'Blog'}]}/>
      <Section><Container>
        <BlogGrid>
          {loading
            ? Array.from({length: BLOG_PAGE_SIZE}).map((_,i)=>(
                <SkeletonCard key={i}>
                  <SkeletonImg/>
                  <div style={{padding:20}}>
                    <SkeletonLine $w="60%" $h="10px"/>
                    <SkeletonLine $w="90%" $h="18px"/>
                    <SkeletonLine $w="80%" $h="18px"/>
                    <SkeletonLine $h="12px"/>
                    <SkeletonLine $w="70%" $h="12px"/>
                    <SkeletonLine $w="30%" $h="13px"/>
                  </div>
                </SkeletonCard>
              ))
            : posts.length === 0
              ? <div style={{gridColumn:'1/-1',textAlign:'center',padding:'60px 20px',color:theme.colors.text}}>
                  <p style={{fontSize:16}}>No blog posts published yet.</p>
                </div>
              : posts.map(post=>(
                  <BlogCard key={post.id}>
                    <BlogImgWrap>
                      <BlogImg className="blog-img" src={resolveCover(post.cover)} alt={post.title}
                        onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/600x220/f1f8f1/82ae46?text=Blog';}}/>
                    </BlogImgWrap>
                    <BlogBody>
                      <BlogMeta>
                        <span><Calendar size={11} style={{display:'inline',marginRight:3}}/>
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
                            : new Date(post.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                        </span>
                        <span><User size={11} style={{display:'inline',marginRight:3}}/>{post.author}</span>
                        <span style={{color:theme.colors.primary}}>{post.category}</span>
                      </BlogMeta>
                      <BlogTitle><Link to={`/blog/${post.id}`}>{post.title}</Link></BlogTitle>
                      <p style={{fontSize:13,color:theme.colors.text,marginBottom:12,lineHeight:1.6}}>{post.excerpt}</p>
                      <ReadMore to={`/blog/${post.id}`}>Read More <Arrow size={13}/></ReadMore>
                    </BlogBody>
                  </BlogCard>
                ))
          }
        </BlogGrid>

        {!loading && totalPages > 1 && (
          <PaginationWrap>
            <PageArrow disabled={page === 1} onClick={() => setPage(p => p - 1)}>&#8592; Prev</PageArrow>
            {getPageNums().map((p, i) =>
              p === '...'
                ? <span key={`e${i}`} style={{padding:'0 4px',color:'#aaa'}}>&#8230;</span>
                : <PageBtn key={p} $active={p === page} onClick={() => setPage(Number(p))}>{p}</PageBtn>
            )}
            <PageArrow disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next &#8594;</PageArrow>
          </PaginationWrap>
        )}

        {!loading && pagination.total > 0 && (
          <p style={{textAlign:'center',fontSize:13,color:theme.colors.text,marginTop:12}}>
            Showing {(page-1)*BLOG_PAGE_SIZE + 1}&#8211;{Math.min(page*BLOG_PAGE_SIZE, pagination.total)} of {pagination.total} posts
          </p>
        )}
      </Container></Section>
    </main>
  );
};

/* ── Contact ───────────────────────────────────────────────────── */
const ContactLayout  = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:40px;@media(max-width:${theme.breakpoints.md}){grid-template-columns:1fr;}`;
const ContactBoxOne  = styled.div`background:#ffffff00;padding:40px;`;
const ContactBox     = styled.div`background:#ffffff00;border:1px solid #82ae4696;padding:40px;`;
const InfoItem       = styled.div`display:flex;gap:16px;padding:16px;border-radius:4px;margin-bottom:12px;background:#ffffff00;transition:${theme.transitions.base};&:hover{background:rgba(130,174,70,0.08);}`;
const InfoIconBox    = styled.div`width:44px;height:44px;border-radius:50%;background:${theme.colors.primary};display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0;`;
const InfoText       = styled.div`h4{font-size:14px;font-weight:${theme.fontWeights.medium};color:${theme.colors.textDark};margin-bottom:2px;}p{font-size:13px;color:${theme.colors.text};margin:0;}`;
const FormField      = styled.div`display:flex;flex-direction:column;gap:6px;margin-bottom:16px;`;
const FormLabel      = styled.label`font-size:13px;font-weight:${theme.fontWeights.medium};color:${theme.colors.text};`;
const CInput         = styled(Input)`border-radius:4px;padding:10px 14px;`;
const Textarea       = styled.textarea`width:100%;padding:10px 14px;border:1px solid #dee2e6;border-radius:4px;font-family:${theme.fonts.body};font-size:14px;color:${theme.colors.textDark};resize:vertical;min-height:120px;outline:none;transition:${theme.transitions.base};&:focus{border-color:${theme.colors.primary};}&::placeholder{color:rgba(0,0,0,0.3);}`;

interface CForm { name:string; email:string; phone:string; subject:string; message:string; }

export const ContactPage: React.FC = () => {
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [cf, setCf] = useState<CForm>({name:'',email:'',phone:'',subject:'',message:''});
  const dispatch = useAppDispatch();

  const upd=(k:keyof CForm)=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>setCf(p=>({...p,[k]:e.target.value}));

  const handleSend = async () => {
    if (!cf.name||!cf.email||!cf.message) { dispatch(showToast({message:'Please fill in all required fields',type:'error'})); return; }
    setLoading(true);
    try {
      await contactApi.submit({ name:cf.name, email:cf.email, message:cf.message, phone:cf.phone||undefined, subject:cf.subject||undefined });
      setSent(true);
      setCf({name:'',email:'',phone:'',subject:'',message:''});
      dispatch(showToast({message:"Message sent! Check your email for confirmation 🌿",type:'success'}));
    } catch(err) {
      dispatch(showToast({message:err instanceof ApiError?err.message:'Failed to send message. Please try again.',type:'error'}));
    } finally { setLoading(false); }
  };

  return (
    <main>
      <PageHero title="Contact Us" breadcrumbs={[{label:'Contact'}]}/>
      <Section style={{background:theme.colors.bgColor5}}><Container>
        <ContactLayout>
          <ContactBoxOne>
            <span className="subheading">Get In Touch</span>
            <h2 style={{fontSize:30,marginBottom:16,fontWeight:theme.fontWeights.semibold}}>We're Here to Help</h2>
            <p style={{color:theme.colors.text,marginBottom:24}}>Have a question? Reach out — our team is available 7 days a week.</p>
            <InfoItem><InfoIconBox><MapPin size={18}/></InfoIconBox><InfoText><h4>Address</h4><p>203 Organic Ave, San Francisco, CA 94102</p></InfoText></InfoItem>
            <InfoItem><InfoIconBox><PhoneIcon size={18}/></InfoIconBox><InfoText><h4>Phone</h4><p>+1 235 235 598</p></InfoText></InfoItem>
            <InfoItem><InfoIconBox><MailIcon size={18}/></InfoIconBox><InfoText><h4>Email</h4><p>hello@vegefoods.com</p></InfoText></InfoItem>
          </ContactBoxOne>
          <ContactBox>
            <span className="subheading">Send a Message</span>
            <h2 style={{fontSize:30,marginBottom:24,fontWeight:theme.fontWeights.semibold}}>Drop Us a Line</h2>
            {sent?(
              <div style={{textAlign:'center',padding:'40px 0'}}>
                <div style={{fontSize:60,marginBottom:16}}>✅</div>
                <h3 style={{fontSize:22,marginBottom:8,color:theme.colors.textDark}}>Message Sent!</h3>
                <p style={{color:theme.colors.text,marginBottom:8}}>Thank you for reaching out. We'll reply within 24 hours.</p>
                <p style={{color:theme.colors.text,fontSize:13}}>A confirmation email has been sent to your inbox.</p>
                <button onClick={()=>setSent(false)} style={{marginTop:20,background:'none',border:`1px solid ${theme.colors.primary}`,borderRadius:20,padding:'8px 20px',color:theme.colors.primary,cursor:'pointer',fontSize:13}}>Send Another Message</button>
              </div>
            ):(
              <>
                <FormField><FormLabel>Full Name *</FormLabel><CInput value={cf.name} onChange={upd('name')} placeholder="John Doe"/></FormField>
                <FormField><FormLabel>Email *</FormLabel><CInput type="email" value={cf.email} onChange={upd('email')} placeholder="john@example.com"/></FormField>
                <FormField><FormLabel>Phone</FormLabel><CInput type="tel" value={cf.phone} onChange={upd('phone')} placeholder="+1 234 567 890"/></FormField>
                <FormField><FormLabel>Subject</FormLabel><CInput value={cf.subject} onChange={upd('subject')} placeholder="How can we help?"/></FormField>
                <FormField><FormLabel>Message *</FormLabel><Textarea value={cf.message} onChange={upd('message')} placeholder="Tell us more…"/></FormField>
                <Button style={{width:'100%',justifyContent:'center'}} onClick={handleSend} disabled={loading}>
                  {loading?<><Loader size={14} style={{animation:'spin 0.8s linear infinite'}}/> Sending…</>:<><Send size={14}/> Send Message</>}
                </Button>
              </>
            )}
          </ContactBox>
        </ContactLayout>
      </Container></Section>
    </main>
  );
};
