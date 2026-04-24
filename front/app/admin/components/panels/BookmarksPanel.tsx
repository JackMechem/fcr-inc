"use client";

import { useState, useEffect, useCallback } from "react";
import { Account, AccountPages } from "@/app/lib/fcr-client";
import { getAccountsWithBookmarks } from "../../actions";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import SpreadsheetTable, { Column } from "../table/SpreadsheetTable";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Flatten accounts into one row per bookmarked car
interface BookmarkRow {
    id: string; // acctId-vin
    acctId: number;
    accountName: string;
    accountEmail: string;
    vin: string;
}

const flattenBookmarks = (accounts: Account[]): BookmarkRow[] =>
    accounts.flatMap((a) =>
        (a.bookmarkedCars ?? []).map((vin) => ({
            id: `${a.acctId}-${vin}`,
            acctId: a.acctId,
            accountName: a.name,
            accountEmail: a.email,
            vin,
        })),
    );

// ── Columns ───────────────────────────────────────────────────────────────────

const BOOKMARK_COLUMNS: Column<BookmarkRow>[] = [
    { key: "acctId",       label: "Account ID", defaultVisible: true, render: (r) => `#${r.acctId}` },
    { key: "accountName",  label: "Name",        defaultVisible: true, render: (r) => r.accountName, minWidth: 150 },
    { key: "accountEmail", label: "Email",       defaultVisible: true, render: (r) => r.accountEmail, minWidth: 180 },
    { key: "vin",          label: "Car VIN",     defaultVisible: true, render: (r) => r.vin, minWidth: 160 },
];

// ── Panel ─────────────────────────────────────────────────────────────────────

const BookmarksPanel = () => {
    const { role } = useUserDashboardStore();
    const isAdmin = role === "ADMIN";

    const [rows, setRows] = useState<BookmarkRow[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<string | number>>(new Set());

    const fetchPage = useCallback(async (p: number, ps: number, isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res: AccountPages = await getAccountsWithBookmarks({ page: p, pageSize: ps });
            setRows(flattenBookmarks(res.data));
            setTotalPages(res.totalPages);
            setTotalItems(res.totalItems);
        } catch (e) {
            alert("Failed to fetch bookmarks: " + e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchPage(page, pageSize); }, [page, pageSize, fetchPage]);

    const handlePageChange = (p: number) => { setPage(p); setSelected(new Set()); };
    const handlePageSizeChange = (ps: number) => { setPageSize(ps); setPage(1); setSelected(new Set()); };
    const handleRefresh = () => fetchPage(page, pageSize, true);

    const filtered = query
        ? rows.filter((r) =>
              `${r.acctId} ${r.accountName} ${r.accountEmail} ${r.vin}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
          )
        : rows;

    return (
        <SpreadsheetTable<BookmarkRow>
            columns={BOOKMARK_COLUMNS}
            data={filtered}
            getRowId={(r) => r.id}
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
            onRefresh={handleRefresh}
            title="Bookmarks by User"
            subtitle={query ? `${filtered.length} matching on this page` : undefined}
            searchQuery={query}
            onSearchChange={setQuery}
            searchPlaceholder="Filter by name, email, or VIN…"
            emptyMessage="No bookmarks found."
        />
    );
};

export default BookmarksPanel;
