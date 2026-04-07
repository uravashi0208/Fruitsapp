/**
 * src/admin/pages/NewsletterPage.tsx
 * Admin: newsletter subscriber management + email campaign sender.
 *
 * Page structure (consistent across ALL admin list pages):
 *   1. useState declarations  (data hooks → filter/pagination → modal/form)
 *   2. Derived / filtered data
 *   3. Modal helpers  (openSend, openDelete, closeModal)
 *   4. API handlers   (toggleStatus, handleDelete, handleSend)
 *   5. Return JSX     (ErrorBanner → stats → AdminDataTable → modals)
 */

import React, { useState } from "react";
import { PortalDropdown, MenuItem } from "../components/PortalDropdown";
import styled from "styled-components";
import { Mail, Trash2, RefreshCw, Search, Send, Users } from "lucide-react";
import { ExportDropdown } from "../components/ExportDropdown";
import { exportData } from "../utils/exportUtils";
import { adminTheme as t } from "../styles/adminTheme";
import {
  AdminBtn,
  IconBtn,
  ToggleTrack,
  ToggleThumb,
  AdminInput,
  AdminTextarea,
  FormGroup,
  FormLabel,
  ModalBackdrop,
  ModalBox,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "../styles/adminShared";
import {
  PageSearchBar,
  PageSearchInp,
  ModalCloseBtn,
  ModalTitle,
  ModalTitleDanger,
  ConfirmText,
  ErrorBanner,
} from "../styles/adminPageComponents";
import { useAdminDispatch, showAdminToast } from "../store";
import { useAdminNewsletter } from "../../hooks/useAdminApi";
import { adminNewsletterApi, NewsletterSubscriber } from "../../api/admin";
import { ApiError } from "../../api/client";
import AdminDropdown from "../components/AdminDropdown";
import AdminDataTable, { TR, TD, ColDef } from "../components/AdminDataTable";
import { formatDate } from "../utils/formatDate";

// ── Page-specific styled components ──────────────────────────────────────────

const StatsRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const StatCard = styled.div<{ $color: string }>`
  flex: 1;
  min-width: 140px;
  background: white;
  border-radius: 12px;
  border: 1px solid ${t.colors.border};
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-left: 4px solid ${({ $color }) => $color};
`;

const StatIcon = styled.div<{ $bg: string }>`
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StatVal = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${t.colors.textPrimary};
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${t.colors.textMuted};
  margin-top: 3px;
`;

const EmailAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${t.colors.primaryGhost};
  border: 1px solid ${t.colors.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${t.colors.primary};
  flex-shrink: 0;
`;

const EmailCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const EmailText = styled.div`
  font-weight: 500;
  color: ${t.colors.textPrimary};
  font-size: 0.875rem;
`;

const CharCount = styled.div<{ $over: boolean }>`
  font-size: 0.75rem;
  text-align: right;
  margin-top: 4px;
  color: ${({ $over }) => ($over ? t.colors.danger : t.colors.textMuted)};
`;

const ResultBox = styled.div<{ $success: boolean }>`
  padding: 16px;
  border-radius: 10px;
  text-align: center;
  background: ${({ $success }) =>
    $success ? t.colors.successBg : t.colors.dangerBg};
  border: 1px solid
    ${({ $success }) => ($success ? t.colors.success : t.colors.danger)};
`;

// ── Constants ─────────────────────────────────────────────────────────────────

const PER_PAGE = 20;
const MAX_MSG = 2000;

type ModalMode = "send" | "delete" | null;

const COLUMNS: ColDef[] = [
  { key: "subscriber", label: "Subscriber" },
  { key: "name", label: "Name" },
  { key: "subscribedOn", label: "Subscribed On" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export const NewsletterPage: React.FC = () => {
  const dispatch = useAdminDispatch();

  // 1a. Data hooks
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "unsubscribed">("");
  const {
    data: allSubs,
    pagination,
    loading,
    error,
    refetch,
  } = useAdminNewsletter({
    page,
    limit: PER_PAGE,
    status: statusFilter || undefined,
  });

  // 1b. Filter
  const [search, setSearch] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // 1c. Optimistic status
  const [localStatus, setLocalStatus] = useState<
    Record<string, "active" | "unsubscribed">
  >({});

  // 1d. Modal / form
  const [mode, setMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<NewsletterSubscriber | null>(null);
  const [saving, setSaving] = useState(false);

  // 1e. Send email form
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  // 2. Derived / filtered data
  const subscribers = (allSubs ?? []).filter((s: NewsletterSubscriber) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.email.toLowerCase().includes(q) ||
      (s.name || "").toLowerCase().includes(q)
    );
  });

  const activeCount = (allSubs ?? []).filter((s) => s.status === "active").length;
  const unsubCount = (allSubs ?? []).filter(
    (s) => s.status === "unsubscribed",
  ).length;

  // 3. Modal helpers
  const openSend = () => {
    setSendResult(null);
    setSubject("");
    setMessage("");
    setMode("send");
  };

  const openDelete = (s: NewsletterSubscriber) => {
    setSelected(s);
    setMode("delete");
  };

  const closeModal = () => {
    setMode(null);
    setSelected(null);
    setSendResult(null);
    setSubject("");
    setMessage("");
  };

  // 4a. Inline status toggle (optimistic)
  const toggleStatus = async (s: NewsletterSubscriber) => {
    const current = localStatus[s.id] ?? s.status;
    const next = current === "active" ? "unsubscribed" : "active";
    setLocalStatus((prev) => ({ ...prev, [s.id]: next }));
    try {
      await adminNewsletterApi.setStatus(s.id, next);
    } catch {
      setLocalStatus((prev) => ({ ...prev, [s.id]: current }));
      dispatch(
        showAdminToast({ message: "Failed to update status", type: "error" }),
      );
    }
  };

  // 4b. Delete subscriber
  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminNewsletterApi.delete(selected.id);
      dispatch(
        showAdminToast({ message: "Subscriber removed", type: "warning" }),
      );
      closeModal();
      refetch();
    } catch (e) {
      dispatch(
        showAdminToast({
          message: e instanceof ApiError ? e.message : "Delete failed",
          type: "error",
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  // 4c. Send email campaign
  const handleSend = async () => {
    if (!subject.trim()) {
      dispatch(
        showAdminToast({ message: "Subject is required", type: "error" }),
      );
      return;
    }
    if (!message.trim()) {
      dispatch(
        showAdminToast({ message: "Message is required", type: "error" }),
      );
      return;
    }
    setSaving(true);
    setSendResult(null);
    try {
      const res = await adminNewsletterApi.send({ subject, message });
      if (res.success && res.data) {
        setSendResult(res.data);
        dispatch(
          showAdminToast({
            message: `Sent to ${res.data.sent} subscriber(s)`,
            type: "success",
          }),
        );
      }
    } catch (e) {
      dispatch(
        showAdminToast({
          message:
            e instanceof ApiError ? e.message : "Failed to send email",
          type: "error",
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  // 5. Render
  return (
    <section>
      {/* Error banner */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <StatsRow>
        <StatCard $color={t.colors.primary}>
          <StatIcon $bg={t.colors.primaryGhost}>
            <Users size={20} color={t.colors.primary} />
          </StatIcon>
          <div>
            <StatVal>{pagination?.total ?? 0}</StatVal>
            <StatLabel>Total Subscribers</StatLabel>
          </div>
        </StatCard>
        <StatCard $color={t.colors.success}>
          <StatIcon $bg={t.colors.successBg}>
            <Mail size={20} color={t.colors.success} />
          </StatIcon>
          <div>
            <StatVal>{activeCount}</StatVal>
            <StatLabel>Active</StatLabel>
          </div>
        </StatCard>
        <StatCard $color={t.colors.warning}>
          <StatIcon $bg={t.colors.warningBg}>
            <Mail size={20} color={t.colors.warning} />
          </StatIcon>
          <div>
            <StatVal>{unsubCount}</StatVal>
            <StatLabel>Unsubscribed</StatLabel>
          </div>
        </StatCard>
      </StatsRow>

      {/* ── Data Table ──────────────────────────────────────────────────── */}
      <AdminDataTable
        title="Newsletter"
        subtitle="Manage subscribers and send email campaigns"
        actions={
          <>
            <ExportDropdown
              loading={exportLoading}
              onExport={async (fmt) => {
                setExportLoading(true);
                try {
                  await exportData(
                    fmt,
                    "newsletter-subscribers",
                    [
                      { label: "Email", key: "email" },
                      { label: "Name", key: "name" },
                      {
                        label: "Status",
                        resolve: (row) =>
                          row["status"] === "active" ? "Active" : "Unsubscribed",
                      },
                      {
                        label: "Subscribed At",
                        resolve: (row) => {
                          const v = row["createdAt"] as string;
                          return v ? formatDate(v) : "—";
                        },
                      },
                    ],
                    (allSubs ?? []) as unknown as Record<string, unknown>[],
                  );
                } finally {
                  setExportLoading(false);
                }
              }}
            />
            <AdminBtn $variant="primary" onClick={openSend}>
              <Send size={15} /> Send Email
            </AdminBtn>
            <IconBtn title="Refresh" onClick={refetch}>
              <RefreshCw size={16} />
            </IconBtn>
          </>
        }
        searchArea={
          <PageSearchBar>
            <Search size={15} color={t.colors.textMuted} />
            <PageSearchInp
              placeholder="Search by email or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </PageSearchBar>
        }
        filterArea={
          <AdminDropdown
            style={{ minWidth: 150 }}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val as "" | "active" | "unsubscribed");
              setPage(1);
            }}
            options={[
              { value: "", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "unsubscribed", label: "Unsubscribed" },
            ]}
          />
        }
        columns={COLUMNS}
        rows={subscribers}
        loading={loading}
        emptyIcon={<Mail size={40} strokeWidth={1} color={t.colors.textMuted} />}
        emptyTitle="No subscribers found"
        emptyText="No subscribers match your current filters."
        renderRow={(s: NewsletterSubscriber) => (
          <TR key={s.id}>
            <TD>
              <EmailCell>
                <EmailAvatar>{s.email.charAt(0).toUpperCase()}</EmailAvatar>
                <EmailText>{s.email}</EmailText>
              </EmailCell>
            </TD>
            <TD>{s.name || "—"}</TD>
            <TD style={{ fontSize: "0.8rem" }}>{formatDate(s.createdAt)}</TD>
            <TD>
              <ToggleTrack
                $on={(localStatus[s.id] ?? s.status) === "active"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatus(s);
                }}
                title="Toggle status"
              >
                <ToggleThumb $on={(localStatus[s.id] ?? s.status) === "active"} />
              </ToggleTrack>
            </TD>
            <TD onClick={(e) => e.stopPropagation()}>
              <PortalDropdown>
                <MenuItem $danger onClick={() => openDelete(s)}>
                  <Trash2 size={13} /> Remove
                </MenuItem>
              </PortalDropdown>
            </TD>
          </TR>
        )}
        showPagination
        paginationInfo={
          (pagination?.total ?? 0) > 0
            ? `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, pagination?.total ?? 0)} of ${pagination?.total ?? 0} subscribers`
            : "0 subscribers"
        }
        currentPage={page}
        totalPages={pagination?.totalPages ?? 1}
        onPageChange={setPage}
      />

      {/* ── Send Email Modal ─────────────────────────────────────────────── */}
      {mode === "send" && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 580, width: "95%" }}
          >
            <ModalHeader>
              <ModalTitle>Send Email Campaign</ModalTitle>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  background: t.colors.primaryGhost,
                  border: `1px solid ${t.colors.primaryLight}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Users size={16} color={t.colors.primary} />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: t.colors.primary,
                    fontWeight: 500,
                  }}
                >
                  This will send to all{" "}
                  <strong>{pagination?.total ?? 0}</strong> active subscriber(s)
                </span>
              </div>

              {sendResult && (
                <ResultBox $success={sendResult.failed === 0}>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    {sendResult.failed === 0 ? "✅" : "⚠️"} Email Sent
                  </div>
                  <div
                    style={{ fontSize: "0.875rem", color: t.colors.textSecondary }}
                  >
                    <strong style={{ color: t.colors.success }}>
                      {sendResult.sent}
                    </strong>{" "}
                    sent successfully
                    {sendResult.failed > 0 && (
                      <>
                        ,{" "}
                        <strong style={{ color: t.colors.danger }}>
                          {sendResult.failed}
                        </strong>{" "}
                        failed
                      </>
                    )}{" "}
                    out of <strong>{sendResult.total}</strong> total
                  </div>
                </ResultBox>
              )}

              <FormGroup>
                <FormLabel>Subject *</FormLabel>
                <AdminInput
                  placeholder="e.g. 🥦 This Week's Fresh Arrivals!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={saving}
                  autoFocus
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>Message *</FormLabel>
                <AdminTextarea
                  rows={8}
                  placeholder="Write your email message here…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={saving}
                  style={{ resize: "vertical" }}
                />
                <CharCount $over={message.length > MAX_MSG}>
                  {message.length} / {MAX_MSG}
                </CharCount>
              </FormGroup>
              <div
                style={{
                  background: t.colors.surfaceAlt,
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: "0.8rem",
                  color: t.colors.textMuted,
                  lineHeight: 1.6,
                }}
              >
                💡 The email will be sent with the branded template including your
                logo, a "Shop Now" button, and an unsubscribe link.
              </div>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal} disabled={saving}>
                {sendResult ? "Close" : "Cancel"}
              </AdminBtn>
              {!sendResult && (
                <AdminBtn
                  $variant="primary"
                  onClick={handleSend}
                  disabled={saving || message.length > MAX_MSG}
                >
                  {saving ? (
                    `Sending to ${pagination?.total ?? 0} subscriber(s)…`
                  ) : (
                    <>
                      <Send size={14} /> Send to {pagination?.total ?? 0}{" "}
                      Subscriber(s)
                    </>
                  )}
                </AdminBtn>
              )}
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {mode === "delete" && selected && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420, width: "95%" }}
          >
            <ModalHeader>
              <ModalTitleDanger>Remove Subscriber</ModalTitleDanger>
              <ModalCloseBtn onClick={closeModal}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                Are you sure you want to permanently remove{" "}
                <strong>{selected.email}</strong>? This cannot be undone.
              </ConfirmText>
            </ModalBody>
            <ModalFooter>
              <AdminBtn $variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </AdminBtn>
              <AdminBtn
                $variant="danger"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? "Removing…" : "Remove Subscriber"}
              </AdminBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}
    </section>
  );
};

export default NewsletterPage;
