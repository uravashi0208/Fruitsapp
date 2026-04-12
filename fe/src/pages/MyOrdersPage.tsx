/**
 * src/pages/MyOrdersPage.tsx
 * Guest order lookup by Order Number — no login required
 */
import React, { useState } from "react";
import styled from "styled-components";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Hash,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PageHero } from "../components/ui/PageHero";
import { theme } from "../styles/theme";
import { Container, Section, Button } from "../styles/shared";
import { NewsletterSection } from "../components/ui/NewsletterSection";
import { publicTrackingApi } from "../api/admin";

const Wrapper = styled.div`
  max-width: 680px;
  margin: 0 auto;
`;

const SearchCard = styled.div`
  background: white;
  border: 1px solid #f0f0f0;
  padding: 40px;
  margin-bottom: 32px;
  text-align: center;
`;

const Icon = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f1f8f1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  svg {
    color: ${theme.colors.primary};
  }
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: ${theme.colors.textDark};
  margin-bottom: 8px;
`;

const Sub = styled.p`
  font-size: 14px;
  color: ${theme.colors.text};
  margin-bottom: 28px;
  line-height: 1.6;
`;

const InputLabel = styled.label`
  display: block;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textDark};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
`;

const InputRow = styled.div`
  display: flex;
  gap: 0;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.2s;
  &:focus-within {
    border-color: ${theme.colors.primary};
  }
  input {
    flex: 1;
    padding: 12px 16px;
    border: none;
    font-family: ${theme.fonts.body};
    font-size: 14px;
    outline: none;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    &::placeholder {
      text-transform: none;
      letter-spacing: normal;
      color: #aaa;
    }
  }
  button {
    padding: 12px 20px;
    background: ${theme.colors.primary};
    border: none;
    color: white;
    cursor: pointer;
    font-family: ${theme.fonts.body};
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.2s;
    white-space: nowrap;
    &:hover {
      background: ${theme.colors.primaryDark};
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;

const ResultCard = styled.div`
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
`;

const ResultHeader = styled.div`
  background: #f9fafb;
  border-bottom: 1px solid #f0f0f0;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const OrderNum = styled.div`
  font-weight: 700;
  font-size: 15px;
  color: ${theme.colors.textDark};
  font-family: ${theme.fonts.mono || "monospace"};
  letter-spacing: 0.5px;
`;

const ResultBody = styled.div`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $s: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  ${({ $s }) =>
    ({
      complete: "background:#f0fdf4;color:#16a34a;",
      delivered: "background:#dcfce7;color:#166534;",
      shipped: "background:#dbeafe;color:#1e40af;",
      processing: "background:#fef9c3;color:#854d0e;",
      confirmed: "background:#e0e7ff;color:#3730a3;",
      pending: "background:#f3f4f6;color:#6b7280;",
      cancelled: "background:#fee2e2;color:#991b1b;",
    })[$s] || "background:#f3f4f6;color:#6b7280;"}
`;

const statusIcon = (s: string) =>
  ({
    complete: <CheckCircle size={11} />,
    delivered: <CheckCircle size={11} />,
    shipped: <Truck size={11} />,
    processing: <Clock size={11} />,
    cancelled: <XCircle size={11} />,
  })[s] || <Package size={11} />;

const STATUS_LABEL: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  processing: "Being Prepared",
  shipped: "Out for Delivery",
  delivered: "Delivered",
  complete: "Completed",
  cancelled: "Cancelled",
};

const HintText = styled.p`
  font-size: 12px;
  color: ${theme.colors.text};
  margin-top: 10px;
  text-align: left;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  background: white;
  border: 1px solid #f0f0f0;
  color: ${theme.colors.text};
`;

const MyOrdersPage: React.FC = () => {
  const [orderNum, setOrderNum] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = orderNum.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError("");
    setResult(null);
    setNotFound(false);
    try {
      const res = await publicTrackingApi.lookup(code);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setNotFound(true);
      }
    } catch (err: any) {
      if (
        err?.status === 404 ||
        err?.message?.toLowerCase().includes("not found")
      ) {
        setNotFound(true);
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = () => {
    if (result?.orderNumber) {
      navigate(`/tracking?order=${encodeURIComponent(result.orderNumber)}`);
    }
  };

  return (
    <main>
      <PageHero
        title="Track My Orders"
        breadcrumbs={[{ label: "My Orders" }]}
      />
      <Section>
        <Container>
          <Wrapper>
            {!result && !loading && (
              <SearchCard>
                <Icon>
                  <Package size={32} />
                </Icon>
                <Title>Find Your Order</Title>
                <Sub>
                  Enter your Order Number to check your order status and track
                  delivery. Your order number was emailed to you when you placed
                  the order.
                </Sub>

                <form onSubmit={handleSearch}>
                  <InputLabel htmlFor="order-lookup">
                    <Hash
                      size={11}
                      style={{ display: "inline", marginRight: 4 }}
                    />
                    Order Number
                  </InputLabel>
                  <InputRow>
                    <input
                      id="order-lookup"
                      type="text"
                      placeholder="e.g. ORD-MNBX-VTT1"
                      value={orderNum}
                      onChange={(e) =>
                        setOrderNum(e.target.value.toUpperCase())
                      }
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="submit"
                      disabled={loading || !orderNum.trim()}
                    >
                      <Search size={16} /> {loading ? "Searching…" : "Look Up"}
                    </button>
                  </InputRow>
                  <HintText>
                    💡 Check your confirmation email for your order number (e.g.
                    ORD-XXXX-XXXX)
                  </HintText>
                </form>

                {error && (
                  <p style={{ color: "#dc2626", fontSize: 13, marginTop: 12 }}>
                    {error}
                  </p>
                )}
              </SearchCard>
            )}

            {/* Not found */}
            {notFound && !loading && (
              <EmptyState>
                <Package
                  size={40}
                  color="#dee2e6"
                  style={{ marginBottom: 12 }}
                />
                <p style={{ fontWeight: 600, marginBottom: 6 }}>
                  Order Not Found
                </p>
                <p style={{ fontSize: 13 }}>
                  No order found for <strong>{orderNum}</strong>.<br />
                  Please double-check your order number and try again.
                </p>
                <Button
                  as={Link as any}
                  to="/contact"
                  $variant="outline"
                  style={{
                    marginTop: 16,
                    display: "inline-flex",
                    fontSize: 13,
                  }}
                >
                  Contact Support
                </Button>
              </EmptyState>
            )}

            {/* Result */}
            {result && !loading && (
              <>
                <p
                  style={{
                    fontSize: 13,
                    color: theme.colors.text,
                    marginBottom: 12,
                  }}
                >
                  Order found — here's your current status:
                </p>
                <ResultCard>
                  <ResultHeader>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: theme.colors.text,
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          marginBottom: 3,
                        }}
                      >
                        Order Number
                      </div>
                      <OrderNum>{result.orderNumber}</OrderNum>
                    </div>
                    <StatusBadge $s={result.status || "pending"}>
                      {statusIcon(result.status || "pending")}
                      {STATUS_LABEL[result.status] ||
                        result.status ||
                        "Pending"}
                    </StatusBadge>
                  </ResultHeader>

                  <ResultBody>
                    {result.trackingCode && (
                      <div style={{ fontSize: 13, color: theme.colors.text }}>
                        Tracking Code:{" "}
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 600,
                            color: "#0891b2",
                            letterSpacing: 1,
                          }}
                        >
                          {result.trackingCode}
                        </span>
                      </div>
                    )}
                    {result.estimatedDelivery &&
                      !["cancelled", "complete", "delivered"].includes(
                        result.status,
                      ) && (
                        <div style={{ fontSize: 13, color: theme.colors.text }}>
                          Est. Delivery:{" "}
                          <strong>
                            {new Date(
                              result.estimatedDelivery,
                            ).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </strong>
                        </div>
                      )}
                    <button
                      onClick={handleTrack}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 13,
                        color: theme.colors.primary,
                        fontWeight: 600,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      Full Tracking Details <ChevronRight size={14} />
                    </button>
                  </ResultBody>
                </ResultCard>
              </>
            )}
          </Wrapper>
        </Container>
      </Section>
      <NewsletterSection />
    </main>
  );
};

export default MyOrdersPage;
