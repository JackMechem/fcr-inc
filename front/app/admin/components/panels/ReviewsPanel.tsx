"use client";

import { useState, useEffect, useCallback } from "react";
import { ReviewPages } from "@/app/lib/fcr-client";
import { getReviews, createReview, updateReview, deleteReview } from "../../actions";
import { Review } from "@/app/types/ReviewTypes";
import SpreadsheetTable, { Column, RowEdit } from "../table/SpreadsheetTable";
import { useTablePermissions } from "../../config/useTablePermissions";
import { ActiveFilter, FilterableColumn, filtersToRecord } from "../table/FilterPanel";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";

const TABLE_TITLE = "Reviews Database";
const EMPTY_FILTERS: ActiveFilter[] = [];

const FILTERABLE_COLUMNS: FilterableColumn[] = [
    { field: "stars", label: "Stars", type: "number" },
    { field: "car",   label: "Car (VIN)", type: "text" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (val: string | number) => {
    const ms = typeof val === "number" ? val * 1000 : new Date(val).getTime();
    return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getAccountId = (account: Review["account"]): string =>
    typeof account === "object" ? String(account.acctId) : String(account);

const getAccountLabel = (account: Review["account"]): string => {
    if (typeof account === "object") {
        return account.name ? `${account.name} (#${account.acctId})` : `#${account.acctId}`;
    }
    return `#${account}`;
};

const getCarVin = (car: Review["car"]): string =>
    typeof car === "object" ? car.vin : String(car);

const StarDisplay = ({ stars }: { stars: number }) => (
    <span style={{ color: "#f59e0b", fontWeight: 600 }}>
        {"★".repeat(Math.round(stars))}{"☆".repeat(5 - Math.round(stars))}
        <span style={{ color: "var(--color-foreground-light)", fontWeight: 400, marginLeft: 4 }}>
            {stars.toFixed(1)}
        </span>
    </span>
);

// ── Columns ───────────────────────────────────────────────────────────────────

const REVIEW_COLUMNS: Column<Review>[] = [
    { key: "reviewId",      label: "ID",       defaultVisible: true,  locked: true, render: (r) => `#${r.reviewId}` },
    { key: "account",       label: "Account",  defaultVisible: true,  render: (r) => getAccountLabel(r.account), minWidth: 160, editable: true, editType: "number", getValue: (r) => getAccountId(r.account) },
    { key: "car",           label: "Car (VIN)",defaultVisible: true,  render: (r) => getCarVin(r.car), minWidth: 140, editable: true, editType: "text", getValue: (r) => getCarVin(r.car) },
    { key: "stars",         label: "Stars",    defaultVisible: true,  render: (r) => <StarDisplay stars={r.stars} />, editable: true, editType: "number", getValue: (r) => r.stars },
    { key: "title",         label: "Title",    defaultVisible: true,  render: (r) => r.title, minWidth: 160, editable: true, editType: "text", getValue: (r) => r.title },
    { key: "bodyOfText",    label: "Body",     defaultVisible: true,  render: (r) => r.bodyOfText, minWidth: 220, editable: true, editType: "text", getValue: (r) => r.bodyOfText },
    { key: "rentalDuration",label: "Duration", defaultVisible: true,  render: (r) => `${r.rentalDuration} day${r.rentalDuration !== 1 ? "s" : ""}`, editable: true, editType: "number", getValue: (r) => r.rentalDuration },
    { key: "publishedDate", label: "Published",defaultVisible: true,  render: (r) => fmtDate(r.publishedDate) },
];

// ── Panel ─────────────────────────────────────────────────────────────────────

const ReviewsPanel = () => {
    const { isAdmin, canEdit, canDelete, canAddRow, lockedCols, permanentlyLockedCols } = useTablePermissions("reviews");

    const [reviews, setReviews] = useState<Review[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<string | number>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const storedFilters = useTablePrefsStore((s) => s.tableFilters[TABLE_TITLE]);
    const storeSetFilters = useTablePrefsStore((s) => s.setTableFilters);
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>((storedFilters ?? EMPTY_FILTERS) as ActiveFilter[]);
    const handleFiltersChange = (f: ActiveFilter[]) => { setActiveFilters(f); storeSetFilters(TABLE_TITLE, f); };

    const fetchPage = useCallback(async (p: number, ps: number, filters: ActiveFilter[] = [], isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), pageSize: String(ps) });
            Object.entries(filtersToRecord(filters)).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
            const res = await fetch(`/api/reviews?${params}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            setReviews(data?.data ?? []);
            setTotalPages(data?.totalPages ?? 1);
            setTotalItems(data?.totalItems ?? 0);
        } catch (e) {
            alert("Failed to fetch reviews: " + e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchPage(page, pageSize, activeFilters); }, [page, pageSize, fetchPage]);
    useEffect(() => { setPage(1); fetchPage(1, pageSize, activeFilters); }, [activeFilters]);

    const handlePageChange = (p: number) => { setPage(p); setSelected(new Set()); };
    const handlePageSizeChange = (ps: number) => { setPageSize(ps); setPage(1); setSelected(new Set()); };
    const handleRefresh = () => fetchPage(page, pageSize, activeFilters, true);

    const handleDeleteOne = async (review: Review) => {
        if (!window.confirm(`Delete review #${review.reviewId}? This cannot be undone.`)) return;
        try {
            await deleteReview(review.reviewId);
            fetchPage(page, pageSize, activeFilters, true);
        } catch (e) {
            alert("Delete failed: " + e);
        }
    };

    const handleCreateRow = async (data: Record<string, string | string[]>) => {
        await createReview({
            car:            String(data.car ?? ""),
            account:        Number(data.account ?? 0),
            stars:          Number(data.stars ?? 5),
            title:          String(data.title ?? ""),
            bodyOfText:     String(data.bodyOfText ?? ""),
            rentalDuration: Number(data.rentalDuration ?? 1),
            publishedDate:  Math.floor(Date.now() / 1000),
        });
        fetchPage(page, pageSize, activeFilters, true);
    };

    const handleSaveEdits = async (edits: RowEdit<Review>[]) => {
        await Promise.all(edits.map(({ id, patch }) =>
            updateReview(id as number, patch as Record<string, unknown>)
        ));
        fetchPage(page, pageSize, activeFilters, true);
    };

    const handleBulkDelete = async () => {
        const ids = [...selected] as number[];
        if (!window.confirm(`Delete ${ids.length} review${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
        setBulkDeleting(true);
        const results = await Promise.allSettled(ids.map((id) => deleteReview(id)));
        const failed = ids.filter((_, i) => results[i].status === "rejected");
        setBulkDeleting(false);
        if (failed.length) alert(`${failed.length} deletion(s) failed.`);
        setSelected(new Set(failed));
        fetchPage(page, pageSize, activeFilters, true);
    };

    const filtered = query
        ? reviews.filter((r) =>
              `${getAccountId(r.account)} ${getCarVin(r.car)} ${r.title} ${r.bodyOfText} ${r.stars}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
          )
        : reviews;

    return (
        <SpreadsheetTable<Review>
            columns={REVIEW_COLUMNS}
            data={filtered}
            getRowId={(r) => r.reviewId}
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
            refreshing={refreshing}
            isAdmin={isAdmin}
            selected={selected}
            onSelectionChange={setSelected}
            onBulkDelete={canDelete ? handleBulkDelete : undefined}
            bulkDeleting={bulkDeleting}
            onSaveEdits={canEdit ? handleSaveEdits : undefined}
            onDeleteOne={canDelete ? handleDeleteOne : undefined}
            onCreateRow={canAddRow ? handleCreateRow : undefined}
            initialLockedCols={lockedCols}
            permanentlyLockedCols={permanentlyLockedCols}
            onRefresh={handleRefresh}
            filterableColumns={FILTERABLE_COLUMNS}
            activeFilters={activeFilters}
            onFiltersChange={handleFiltersChange}
            title="Reviews Database"
            subtitle={query ? `${filtered.length} matching on this page` : undefined}
            searchQuery={query}
            onSearchChange={setQuery}
            searchPlaceholder="Filter by account, car, title…"
            emptyMessage="No reviews found."
        />
    );
};

export default ReviewsPanel;
