"use client";

import { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
    BiEdit,
    BiTrash,
    BiDotsVerticalRounded,
    BiChevronLeft,
    BiChevronRight,
    BiRefresh,
    BiSearch,
    BiHide,
    BiText,
    BiCopy,
    BiMenu,
    BiFullscreen,
    BiExitFullscreen,
} from "react-icons/bi";
import styles from "./spreadsheetTable.module.css";

// ── Public types ─────────────────────────────────────────────────────────────

export interface Column<T> {
    key: string;
    label: string;
    defaultVisible: boolean;
    render: (item: T) => ReactNode;
    minWidth?: number;
}

export interface SpreadsheetTableProps<T> {
    columns: Column<T>[];
    data: T[];
    getRowId: (item: T) => string | number;
    // Pagination
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    // State
    loading: boolean;
    isAdmin: boolean;
    // Selection + bulk delete
    selected: Set<string | number>;
    onSelectionChange: (s: Set<string | number>) => void;
    onBulkDelete: () => void;
    bulkDeleting: boolean;
    // Row actions
    onEdit: (item: T) => void;
    onDeleteOne?: (item: T) => void;
    // Header
    title: string;
    subtitle?: string;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    searchPlaceholder?: string;
    onRefresh: () => void;
    refreshing?: boolean;
    headerActions?: ReactNode;
    // Custom search override (replaces default search bar)
    searchContent?: ReactNode;
    // Misc
    emptyMessage?: string;
}

// ── Row action menu ──────────────────────────────────────────────────────────

function RowActionMenu<T>({
    item,
    isAdmin,
    onEdit,
    onDelete,
}: {
    item: T;
    isAdmin: boolean;
    onEdit: (item: T) => void;
    onDelete?: (item: T) => void;
}) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)
            )
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleToggle = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 2, left: rect.left });
        }
        setOpen((o) => !o);
    };

    return (
        <>
            <button
                ref={btnRef}
                className={styles.dotsBtn}
                onClick={handleToggle}
            >
                <BiDotsVerticalRounded />
            </button>
            {open && createPortal(
                <div
                    ref={menuRef}
                    className={styles.contextMenu}
                    style={{ top: pos.top, left: pos.left }}
                >
                    <button
                        className={styles.ctxItem}
                        onClick={() => { setOpen(false); onEdit(item); }}
                    >
                        <BiEdit /> Edit
                    </button>
                    {isAdmin && onDelete && (
                        <button
                            className={`${styles.ctxItem} ${styles.rowMenuDanger}`}
                            onClick={() => { setOpen(false); onDelete(item); }}
                        >
                            <BiTrash /> Delete
                        </button>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}

// ── Context menu types ──────────────────────────────────────────────────────

interface ContextMenuState {
    x: number;
    y: number;
    colKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rowItem: any;
    cellText: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SpreadsheetTable<T>({
    columns,
    data,
    getRowId,
    page,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    loading,
    isAdmin,
    selected,
    onSelectionChange,
    onBulkDelete,
    bulkDeleting,
    onEdit,
    onDeleteOne,
    title,
    subtitle,
    searchQuery,
    onSearchChange,
    searchPlaceholder = "Search\u2026",
    onRefresh,
    refreshing,
    headerActions,
    searchContent,
    emptyMessage = "No data found.",
}: SpreadsheetTableProps<T>) {
    // Column visibility
    const [visibleCols, setVisibleCols] = useState<Set<string>>(
        () => new Set(columns.filter((c) => c.defaultVisible).map((c) => c.key)),
    );
    const [colMenuOpen, setColMenuOpen] = useState(false);
    const menuBtnRef = useRef<HTMLButtonElement>(null);
    const colMenuRef = useRef<HTMLDivElement>(null);
    const [colMenuPos, setColMenuPos] = useState({ top: 0, right: 0 });

    // Search popup
    const [searchOpen, setSearchOpen] = useState(false);
    const searchBtnRef = useRef<HTMLButtonElement>(null);
    const searchPopupRef = useRef<HTMLDivElement>(null);
    const [searchPopupPos, setSearchPopupPos] = useState({ top: 0, right: 0 });

    useEffect(() => {
        if (!searchOpen) return;
        const handler = (e: MouseEvent) => {
            if (
                searchPopupRef.current && !searchPopupRef.current.contains(e.target as Node) &&
                searchBtnRef.current && !searchBtnRef.current.contains(e.target as Node)
            ) setSearchOpen(false);
        };
        const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setSearchOpen(false); };
        document.addEventListener("mousedown", handler);
        document.addEventListener("keydown", keyHandler);
        return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", keyHandler); };
    }, [searchOpen]);

    const openSearch = () => {
        if (searchBtnRef.current) {
            const r = searchBtnRef.current.getBoundingClientRect();
            setSearchPopupPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
        }
        setSearchOpen((o) => !o);
    };

    useEffect(() => {
        if (!colMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (
                colMenuRef.current && !colMenuRef.current.contains(e.target as Node) &&
                menuBtnRef.current && !menuBtnRef.current.contains(e.target as Node)
            ) setColMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [colMenuOpen]);

    const openColMenu = () => {
        if (!colMenuOpen && menuBtnRef.current) {
            const r = menuBtnRef.current.getBoundingClientRect();
            setColMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
        }
        setColMenuOpen((o) => !o);
    };

    const toggleCol = (key: string) => {
        const isHiding = visibleCols.has(key);
        setVisibleCols((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
        setColWidths((prev) => {
            const next = { ...prev };
            if (isHiding) {
                delete next[key];
            } else if (stickyColWidth !== null) {
                // In fixed mode — give the new column a default width so it's visible
                const col = columns.find((c) => c.key === key);
                next[key] = col?.minWidth ?? 150;
            }
            return next;
        });
    };

    const activeCols = columns.filter((c) => visibleCols.has(c.key));

    // Column widths (resizable)
    const [colWidths, setColWidths] = useState<Record<string, number>>({});
    const [stickyColWidth, setStickyColWidth] = useState<number | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);

    // Snapshot all column widths from the DOM
    const snapshotWidths = useCallback(() => {
        const table = tableRef.current;
        if (!table) return;
        const ths = table.querySelectorAll<HTMLElement>("thead th");
        const snap: Record<string, number> = {};
        let stickyW = 0;
        ths.forEach((el, i) => {
            const w = el.getBoundingClientRect().width;
            if (i === 0) { stickyW = w; return; }
            const col = activeCols[i - 1];
            if (col) snap[col.key] = w;
        });
        setStickyColWidth(stickyW);
        setColWidths(snap);
    }, [activeCols]);

    // Drag the border between column at index `colIdx` (left) and colIdx+1 (right).
    const handleResizeStart = (colIdx: number, e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;

        // Snapshot every column from the DOM
        const table = tableRef.current;
        if (!table) return;
        const ths = table.querySelectorAll<HTMLElement>("thead th");
        const snap: Record<string, number> = {};
        let stickyW = 0;
        ths.forEach((el, i) => {
            const w = el.getBoundingClientRect().width;
            if (i === 0) { stickyW = w; return; }
            const col = activeCols[i - 1];
            if (col) snap[col.key] = w;
        });
        setStickyColWidth(stickyW);
        setColWidths(snap);

        const leftKey = activeCols[colIdx].key;
        const rightKey = activeCols[colIdx + 1]?.key;
        const leftStartW = snap[leftKey];
        const rightStartW = rightKey ? snap[rightKey] : 0;

        const onMove = (ev: MouseEvent) => {
            const diff = ev.clientX - startX;
            const leftW = Math.max(40, leftStartW + diff);
            const clampedDiff = leftW - leftStartW;
            setColWidths((prev) => {
                const next = { ...prev, [leftKey]: leftW };
                if (rightKey) {
                    next[rightKey] = Math.max(40, rightStartW - clampedDiff);
                }
                return next;
            });
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    };

    const isFixed = stickyColWidth !== null;

    // Wrap toggle — snapshot widths before toggling so columns keep their size
    const [wrapMode, setWrapMode] = useState(false);
    const handleToggleWrap = () => {
        snapshotWidths();
        setWrapMode((w) => !w);
    };

    // Per-column wrap overrides
    const [colWrapOverrides, setColWrapOverrides] = useState<Record<string, boolean>>({});

    // Selection helpers
    const toggleSelectAll = () => {
        const ids = data.map(getRowId);
        const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
        onSelectionChange(allSelected ? new Set() : new Set(ids));
    };

    const toggleSelect = (id: string | number) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        onSelectionChange(next);
    };

    // Pagination display
    const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalItems);

    // ── Right-click context menu ─────────────────────────────────────────
    const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
    const ctxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ctxMenu) return;
        const handler = (e: MouseEvent) => {
            if (ctxRef.current && !ctxRef.current.contains(e.target as Node))
                setCtxMenu(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [ctxMenu]);

    const handleContextMenu = (e: React.MouseEvent, colKey: string, rowItem: T | null) => {
        e.preventDefault();
        const td = (e.target as HTMLElement).closest("td, th");
        const cellText = td?.textContent?.trim() ?? "";
        setCtxMenu({ x: e.clientX, y: e.clientY, colKey, rowItem: rowItem as unknown, cellText });
    };

    const closeCtx = () => setCtxMenu(null);

    const ctxCopyCell = () => {
        if (ctxMenu) navigator.clipboard.writeText(ctxMenu.cellText);
        closeCtx();
    };

    const ctxToggleColWrap = () => {
        if (!ctxMenu) return;
        setColWrapOverrides((prev) => {
            const cur = prev[ctxMenu.colKey] ?? wrapMode;
            return { ...prev, [ctxMenu.colKey]: !cur };
        });
        closeCtx();
    };

    const ctxHideColumn = () => {
        if (!ctxMenu) return;
        toggleCol(ctxMenu.colKey);
        closeCtx();
    };

    const ctxEditRow = () => {
        if (ctxMenu?.rowItem) onEdit(ctxMenu.rowItem as T);
        closeCtx();
    };

    const ctxDeleteRow = () => {
        if (ctxMenu?.rowItem && onDeleteOne) onDeleteOne(ctxMenu.rowItem as T);
        closeCtx();
    };

    const ctxSelectRow = () => {
        if (ctxMenu?.rowItem) {
            const id = getRowId(ctxMenu.rowItem as T);
            toggleSelect(id);
        }
        closeCtx();
    };

    // Helper: should a column wrap?
    const shouldWrap = (key: string) => colWrapOverrides[key] ?? wrapMode;

    // ── Fullscreen overlay ───────────────────────────────────────────────
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsFullscreen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    const toggleFullscreen = () => setIsFullscreen((f) => !f);

    // ── Drag-to-scroll ───────────────────────────────────────────────────
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

    const handleScrollMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest("button, input, a, select, label")) return;
        const el = scrollContainerRef.current;
        if (!el) return;
        dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
        el.style.cursor = "grabbing";
        el.style.userSelect = "none";
        e.preventDefault();
    }, []);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const d = dragRef.current;
            if (!d.active) return;
            const el = scrollContainerRef.current;
            if (!el) return;
            el.scrollLeft = d.scrollLeft - (e.clientX - d.startX);
            el.scrollTop = d.scrollTop - (e.clientY - d.startY);
        };
        const onUp = () => {
            if (!dragRef.current.active) return;
            dragRef.current.active = false;
            const el = scrollContainerRef.current;
            if (el) { el.style.cursor = ""; el.style.userSelect = ""; }
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    }, []);

    return (
        <div className={`${styles.container} ${isFullscreen ? styles.containerFullscreen : ""}`}>
            {/* ── Header bar ───────────────────────────────────────────── */}
            <div className={styles.topBar}>
                <button
                    onClick={toggleFullscreen}
                    className={`${styles.btnIcon} ${isFullscreen ? styles.btnIconActive : ""}`}
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                    {isFullscreen ? <BiExitFullscreen /> : <BiFullscreen />}
                </button>
                <h2 className={styles.topTitle}>{title}</h2>
                {subtitle && <span className={styles.topSubtitle}>{subtitle}</span>}
                <div style={{ flex: 1 }} />
                {headerActions}
                <button
                    ref={searchBtnRef}
                    onClick={openSearch}
                    className={`${styles.btnIcon} ${searchOpen ? styles.btnIconActive : ""}`}
                    title="Search"
                >
                    <BiSearch />
                </button>
                <button
                    onClick={onRefresh}
                    disabled={loading || refreshing}
                    className={styles.btnIcon}
                    title="Refresh"
                >
                    <BiRefresh className={refreshing ? styles.spinning : ""} />
                </button>
                <button
                    ref={menuBtnRef}
                    onClick={openColMenu}
                    className={`${styles.btnIcon} ${colMenuOpen ? styles.btnIconActive : ""}`}
                    title="Columns"
                >
                    <BiMenu />
                </button>
            </div>

            {/* ── Column menu popup ─────────────────────────────────────── */}
            {colMenuOpen && createPortal(
                <div
                    ref={colMenuRef}
                    className={styles.contextMenu}
                    style={{ top: colMenuPos.top, right: colMenuPos.right, left: "auto", maxHeight: 400, overflowY: "auto" }}
                >
                    <div className={styles.ctxSection}>Options</div>
                    <button className={styles.ctxItem} onClick={handleToggleWrap}>
                        <BiText />
                        {wrapMode ? "Disable Wrap" : "Enable Wrap"}
                    </button>
                    <div className={styles.ctxDivider} />
                    <div className={styles.ctxSection}>Columns</div>
                    {columns.map((col) => (
                        <label key={col.key} className={styles.ctxItem}>
                            <input
                                type="checkbox"
                                checked={visibleCols.has(col.key)}
                                onChange={() => toggleCol(col.key)}
                                style={{ accentColor: "var(--color-accent)", cursor: "pointer" }}
                            />
                            {col.label}
                        </label>
                    ))}
                </div>,
                document.body
            )}

            {/* ── Search popup ──────────────────────────────────────────── */}
            {searchOpen && createPortal(
                <div
                    ref={searchPopupRef}
                    className={styles.searchPopup}
                    style={{ top: searchPopupPos.top, right: searchPopupPos.right }}
                >
                    {searchContent ?? (
                        <div className={styles.searchWrapper}>
                            <BiSearch className={styles.searchIcon} />
                            <input
                                autoFocus
                                className={styles.searchInput}
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                    )}
                </div>,
                document.body
            )}

            {/* ── Bulk actions ──────────────────────────────────────────── */}
            {selected.size > 0 && isAdmin && (
                <div className={styles.bulkBar}>
                    <span>{selected.size} selected</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                            className={styles.bulkDeleteBtn}
                            onClick={onBulkDelete}
                            disabled={bulkDeleting}
                        >
                            {bulkDeleting ? (
                                <BiRefresh className={styles.spinning} />
                            ) : (
                                <BiTrash />
                            )}
                            Delete {selected.size}
                        </button>
                        <button
                            className={styles.bulkClearBtn}
                            onClick={() => onSelectionChange(new Set())}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* ── Table ─────────────────────────────────────────────────── */}
            <div className={styles.scrollContainer} ref={scrollContainerRef} onMouseDown={handleScrollMouseDown}>
                {loading ? (
                    <div className={styles.loadingOverlay}>
                        <BiRefresh className={styles.spinning} />
                        Loading&hellip;
                    </div>
                ) : data.length === 0 ? (
                    <div className={styles.loadingOverlay}>{emptyMessage}</div>
                ) : (
                    <table
                        ref={tableRef}
                        className={styles.table}
                        style={isFixed ? {
                            tableLayout: "fixed",
                            width: (stickyColWidth ?? 0) + Object.values(colWidths).reduce((a, b) => a + b, 0),
                        } : undefined}
                    >
                        <thead>
                            <tr>
                                <th
                                    className={styles.stickyCol}
                                    style={stickyColWidth ? { width: stickyColWidth } : undefined}
                                >
                                    <div className={styles.stickyColInner}>
                                        <span className={styles.dotsPlaceholder} />
                                        {isAdmin && (
                                            <input
                                                type="checkbox"
                                                className={styles.cb}
                                                checked={
                                                    data.length > 0 &&
                                                    data.every((item) =>
                                                        selected.has(getRowId(item)),
                                                    )
                                                }
                                                onChange={toggleSelectAll}
                                            />
                                        )}
                                    </div>
                                </th>
                                {activeCols.map((col, i) => (
                                    <th
                                        key={col.key}
                                        style={{
                                            width: colWidths[col.key] || undefined,
                                            minWidth: col.minWidth || undefined,
                                        }}
                                        onContextMenu={(e) => handleContextMenu(e, col.key, null)}
                                    >
                                        {col.label}
                                        {i < activeCols.length - 1 && (
                                            <span
                                                className={styles.resizeHandle}
                                                onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(i, e); }}
                                            />
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => {
                                const id = getRowId(item);
                                return (
                                    <tr key={String(id)}>
                                        <td className={styles.stickyCol}>
                                            <div className={styles.stickyColInner}>
                                                <RowActionMenu
                                                    item={item}
                                                    isAdmin={isAdmin}
                                                    onEdit={onEdit}
                                                    onDelete={onDeleteOne}
                                                />
                                                {isAdmin && (
                                                    <input
                                                        type="checkbox"
                                                        className={styles.cb}
                                                        checked={selected.has(id)}
                                                        onChange={() =>
                                                            toggleSelect(id)
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        {activeCols.map((col) => {
                                            const wrap = shouldWrap(col.key);
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={wrap ? styles.wrappedCell : undefined}
                                                    onContextMenu={(e) => handleContextMenu(e, col.key, item)}
                                                >
                                                    {col.render(item)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Right-click context menu ─────────────────────────────── */}
            {ctxMenu && createPortal(
                <div
                    ref={ctxRef}
                    className={styles.contextMenu}
                    style={{ top: ctxMenu.y, left: ctxMenu.x }}
                >
                    {/* Column section */}
                    <div className={styles.ctxSection}>Column</div>
                    <button className={styles.ctxItem} onClick={ctxToggleColWrap}>
                        <BiText />
                        {shouldWrap(ctxMenu.colKey) ? "No Wrap Column" : "Wrap Column"}
                    </button>
                    <button className={styles.ctxItem} onClick={ctxHideColumn}>
                        <BiHide /> Hide Column
                    </button>

                    {/* Cell section */}
                    <div className={styles.ctxDivider} />
                    <div className={styles.ctxSection}>Cell</div>
                    <button className={styles.ctxItem} onClick={ctxCopyCell}>
                        <BiCopy /> Copy Cell
                    </button>

                    {/* Row section (only if right-clicked on a data row) */}
                    {ctxMenu.rowItem && (
                        <>
                            <div className={styles.ctxDivider} />
                            <div className={styles.ctxSection}>Row</div>
                            <button className={styles.ctxItem} onClick={ctxEditRow}>
                                <BiEdit /> Edit Row
                            </button>
                            {isAdmin && (
                                <button className={styles.ctxItem} onClick={ctxSelectRow}>
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={selected.has(getRowId(ctxMenu.rowItem as T))}
                                        style={{ accentColor: "var(--color-accent)", pointerEvents: "none" }}
                                    />
                                    Select Row
                                </button>
                            )}
                            {isAdmin && onDeleteOne && (
                                <button className={`${styles.ctxItem} ${styles.rowMenuDanger}`} onClick={ctxDeleteRow}>
                                    <BiTrash /> Delete Row
                                </button>
                            )}
                        </>
                    )}
                </div>,
                document.body
            )}

            {/* ── Pagination ────────────────────────────────────────────── */}
            {totalPages > 0 && (
                <div className={styles.pagination}>
                    <div className={styles.pageInfo}>
                        <span>
                            {startItem}&ndash;{endItem} of {totalItems}
                        </span>
                        <select
                            className={styles.pageSizeSelect}
                            value={pageSize}
                            onChange={(e) =>
                                onPageSizeChange(Number(e.target.value))
                            }
                        >
                            {[10, 25, 50, 100].map((n) => (
                                <option key={n} value={n}>
                                    {n} / page
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.pageControls}>
                        <button
                            className={styles.pageBtn}
                            disabled={page <= 1}
                            onClick={() => onPageChange(page - 1)}
                        >
                            <BiChevronLeft />
                        </button>
                        <span className={styles.pageText}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            className={styles.pageBtn}
                            disabled={page >= totalPages}
                            onClick={() => onPageChange(page + 1)}
                        >
                            <BiChevronRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
