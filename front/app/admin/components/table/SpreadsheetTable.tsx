"use client";

import { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
    BiEdit,
    BiTrash,
    BiDotsVerticalRounded,
    BiChevronLeft,
    BiChevronRight,
    BiChevronUp,
    BiChevronDown,
    BiRefresh,
    BiSearch,
    BiHide,
    BiText,
    BiCopy,
    BiMenu,
    BiFullscreen,
    BiExitFullscreen,
    BiDownload,
    BiCheck,
    BiX,
    BiPencil,
    BiColumns,
    BiLock,
    BiGridVertical,
    BiShow,
    BiReset,
    BiLinkExternal,
    BiPlus,
    BiImages,
    BiFilter,
    BiTable,
    BiCode,
    BiPrinter,
    BiClipboard,
    BiUpload,
} from "react-icons/bi";
import ExportButton, { ExportOption } from "./ExportButton";
import { downloadData, safeFilename, buildCsv, escapeCell, parseCsv } from "./exportUtils";
import { PiSortAscending, PiSortDescending, PiSparkleFill } from "react-icons/pi";
import ReactMarkdown from "react-markdown";
import { format as dateFnsFormat } from "date-fns";
import DatePicker from "@/app/components/DatePicker";
import styles from "./spreadsheetTable.module.css";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";
import { FilterableColumn, ActiveFilter, formatFilterLabel } from "./FilterPanel";
import BrowseFilterPanel from "./BrowseFilterPanel";
export type { FilterableColumn, ActiveFilter } from "./FilterPanel";

// ── Public types ─────────────────────────────────────────────────────────────

export interface Column<T> {
    key: string;
    label: string;
    defaultVisible: boolean;
    render: (item: T) => ReactNode;
    minWidth?: number;
    // Edit mode
    editable?: boolean;
    editType?: "text" | "number" | "textarea" | "datetime-local" | "date" | "select" | "markdown" | "tags" | "images";
    editOptions?: string[];
    getValue?: (item: T) => string | number;
    getTagsValue?: (item: T) => string[];
    getImagesValue?: (item: T) => string[];
    // Sort — key sent to backend; defaults to col.key
    sortKey?: string;
    // AI auto-fill for markdown columns
    aiGenerate?: (item: T) => Promise<string>;
    // Always show this column as an editable field in the new-row form,
    // even when the column is hidden in the main table.
    newRowVisible?: boolean;
    // If this cell links to a record in another table, define the jump target here.
    references?: {
        view: string;           // UserDashboardView to navigate to
        label: string;          // e.g. "User", "Car", "Payment"
        getSearchTerm: (item: T) => string | null; // the search string to pre-fill
    };
    // Permanently locked — cannot be unlocked by the user (e.g. primary-key columns).
    locked?: boolean;
    // Allow editing this column in the new-row form even when it is locked.
    newRowEditable?: boolean;
}

export interface RowEdit<T> {
    id: string | number;
    original: T;
    patch: Record<string, unknown>;
}

interface CommitChange {
    key: string;
    label: string;
    from: string;
    to: string;
}

interface CommitResult {
    id: string | number;
    changes: CommitChange[];
    status: "idle" | "saving" | "success" | "error";
    error?: string;
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
    onBulkDelete?: () => void;
    bulkDeleting?: boolean;
    // Row actions
    onEdit?: (item: T) => void;
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
    // Inline edit mode
    onSaveEdits?: (edits: RowEdit<T>[]) => Promise<void>;
    // Preview panel
    renderPreview?: (item: T) => ReactNode;
    // Row link (adds "Go to" in right-click menu)
    getRowLink?: (item: T) => string;
    // Called when user clicks "Go to reference" on a cell with references defined
    onGoToReference?: (view: string, searchTerm: string) => void;
    // Server-side sort (controlled)
    sortBy?: string | null;
    sortDir?: "asc" | "desc";
    onSortChange?: (col: string, dir: "asc" | "desc") => void;
    // New row creation
    onCreateRow?: (data: Record<string, string | string[]>) => Promise<void>;
    // Keys that must be non-empty before new-row AI generation is allowed
    aiRequiredFields?: string[];
    // Column keys that should start locked by default (can be toggled by user).
    // Columns with col.locked=true are always locked regardless of this.
    initialLockedCols?: string[];
    // Column keys that non-admins cannot unlock (admins can still toggle them).
    // These columns are still editable in the new-row form when onCreateRow is provided.
    permanentlyLockedCols?: string[];
    // Server-side filters
    filterableColumns?: FilterableColumn[];
    activeFilters?: ActiveFilter[];
    onFiltersChange?: (filters: ActiveFilter[]) => void;
    // When set, CSV import matches rows by this column key — matched rows are
    // queued as edits instead of new drafts.
    importMatchKey?: string;
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
    onEdit?: (item: T) => void;
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
                    {onEdit && (
                        <button
                            className={styles.ctxItem}
                            onClick={() => { setOpen(false); onEdit(item); }}
                        >
                            <BiEdit /> Edit
                        </button>
                    )}
                    {onDelete && (
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

// ── Tags editor ──────────────────────────────────────────────────────────────

function TagsEditor({ tags, onChange, onNavigateDown, onClose }: {
    tags: string[];
    onChange: (tags: string[]) => void;
    onNavigateDown?: () => void;
    onClose?: () => void;
}) {
    const [input, setInput] = useState("");
    const add = () => {
        const t = input.trim();
        if (t && !tags.includes(t)) onChange([...tags, t]);
        setInput("");
    };
    const remove = (tag: string) => onChange(tags.filter((f) => f !== tag));
    return (
        <div
            className={styles.tagsEditor}
            tabIndex={-1}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) onClose?.();
            }}
            onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
        >
            {tags.map((tag, i) => (
                <span key={tag + i} className={styles.tagsEditorTag}>
                    {tag}
                    <button
                        type="button"
                        className={styles.tagsEditorRemove}
                        onClick={(e) => { e.stopPropagation(); remove(tag); }}
                    >
                        <BiX />
                    </button>
                </span>
            ))}
            <input
                className={styles.tagsEditorInput}
                placeholder={tags.length === 0 ? "Add feature…" : "Add…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") { e.preventDefault(); onClose?.(); return; }
                    if (e.key === "Enter") {
                        e.preventDefault();
                        if (input.trim()) {
                            add();
                        } else {
                            onNavigateDown?.();
                        }
                    }
                    if (e.key === "Backspace" && input === "" && tags.length > 0) remove(tags[tags.length - 1]);
                }}
                onBlur={add}
                autoFocus
            />
        </div>
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
    isNewRow?: boolean;
    draftId?: string;
}

// ── Draft row type ────────────────────────────────────────────────────────────
type DraftRow = {
    id: string;
    values: Record<string, string | string[]>;
    aiLoading: Record<string, boolean>;
    fillAiLoading: boolean;
};

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
    onSaveEdits,
    sortBy,
    sortDir = "asc",
    onSortChange,
    renderPreview,
    getRowLink,
    onGoToReference,
    onCreateRow,
    aiRequiredFields,
    initialLockedCols,
    permanentlyLockedCols,
    filterableColumns,
    activeFilters,
    onFiltersChange,
    importMatchKey,
}: SpreadsheetTableProps<T>) {
    const { visibleCols: savedVisibleCols, colWidths: savedColWidths, colOrder: savedColOrder, lockedCols: savedLockedCols,
            setVisibleCols: saveVisibleCols, setColWidths: saveColWidths, setColOrder: saveColOrder, setLockedCols: saveLockedCols } = useTablePrefsStore();

    // Column visibility — initialized from persisted prefs, falling back to defaultVisible.
    // Columns with newRowVisible:true are only shown in the add-row form, never in the main table.
    const [visibleCols, setVisibleCols] = useState<Set<string>>(() => {
        const saved = savedVisibleCols[title];
        if (saved && saved.length > 0) {
            const validKeys = new Set(columns.filter((c) => !c.newRowVisible).map((c) => c.key));
            const filtered = saved.filter((k) => validKeys.has(k));
            if (filtered.length > 0) return new Set(filtered);
        }
        return new Set(columns.filter((c) => c.defaultVisible && !c.newRowVisible).map((c) => c.key));
    });

    // User-toggled column locks (persisted).
    // col.locked = admin-toggleable hardcoded lock (non-admins cannot toggle).
    // permanentlyLockedCols = config-driven locks that nobody can toggle, including admins.
    const isHardLocked = (key: string) => !!(permanentlyLockedCols?.includes(key));
    const isAdminOnlyLocked = (key: string) => !!(columns.find((c) => c.key === key)?.locked);
    const isPermanentForRole = (key: string) => isHardLocked(key) || (!isAdmin && isAdminOnlyLocked(key));
    const [userLockedCols, setUserLockedColsState] = useState<Set<string>>(() => {
        const permanentKeys = [
            ...columns.filter((c) => c.locked).map((c) => c.key),
            ...(permanentlyLockedCols ?? []),
        ];
        const saved = savedLockedCols[title];
        if (saved) {
            const s = new Set(saved);
            // Always enforce hard locks; non-admins also get col.locked enforced
            permanentKeys.forEach((k) => s.add(k));
            return s;
        }
        return new Set([...(initialLockedCols ?? []), ...permanentKeys]);
    });
    const isColLocked = (key: string) => isHardLocked(key) || userLockedCols.has(key);
    const toggleColLock = (key: string) => {
        if (isPermanentForRole(key)) return;
        const next = new Set(userLockedCols);
        next.has(key) ? next.delete(key) : next.add(key);
        setUserLockedColsState(next);
        saveLockedCols(title, [...next]);
    };

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

    const openSearch = (anchor?: HTMLElement) => {
        const el = anchor ?? searchBtnRef.current;
        if (el) {
            const r = el.getBoundingClientRect();
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

    const openColMenu = (anchor?: HTMLElement) => {
        if (!colMenuOpen) {
            const el = anchor ?? menuBtnRef.current;
            if (el) {
                const r = el.getBoundingClientRect();
                setColMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
            }
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

    // Sync visible cols to store whenever they change
    useEffect(() => {
        saveVisibleCols(title, [...visibleCols]);
    }, [visibleCols]); // eslint-disable-line react-hooks/exhaustive-deps

    // Column order (drag-to-reorder, persisted via Zustand)
    const [colOrder, setColOrder] = useState<string[]>(() => {
        const defaultOrder = columns.map((c) => c.key);
        const saved = savedColOrder[title];
        if (saved && saved.length > 0) {
            const kept = saved.filter((k) => defaultOrder.includes(k));
            const added = defaultOrder.filter((k) => !kept.includes(k));
            return [...kept, ...added];
        }
        return defaultOrder;
    });

    useEffect(() => {
        saveColOrder(title, colOrder);
    }, [colOrder]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setColOrder((prev) => {
            const newKeys = columns.map((c) => c.key);
            const kept = prev.filter((k) => newKeys.includes(k));
            const added = newKeys.filter((k) => !prev.includes(k));
            return [...kept, ...added];
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns.map((c) => c.key).join(",")]);

    const orderedColumns = colOrder
        .map((k) => columns.find((c) => c.key === k))
        .filter(Boolean) as Column<T>[];
    const activeCols = orderedColumns.filter((c) => !c.newRowVisible && visibleCols.has(c.key));

    // Column menu drag-to-reorder
    const [menuDragKey, setMenuDragKey] = useState<string | null>(null);
    const [menuDragOverKey, setMenuDragOverKey] = useState<string | null>(null);
    const menuDragStateRef = useRef<{ fromKey: string; overKey: string | null }>({ fromKey: "", overKey: null });

    const handleMenuDragStart = (key: string) => {
        menuDragStateRef.current = { fromKey: key, overKey: null };
        setMenuDragKey(key);
        const onUp = () => {
            const { fromKey, overKey } = menuDragStateRef.current;
            if (overKey && overKey !== fromKey) {
                setColOrder((prev) => {
                    const next = [...prev];
                    const fromIdx = next.indexOf(fromKey);
                    const toIdx = next.indexOf(overKey);
                    if (fromIdx !== -1 && toIdx !== -1) {
                        next.splice(fromIdx, 1);
                        next.splice(toIdx, 0, fromKey);
                    }
                    return next;
                });
            }
            setMenuDragKey(null);
            setMenuDragOverKey(null);
            menuDragStateRef.current = { fromKey: "", overKey: null };
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mouseup", onUp);
    };

    const handleMenuDragEnter = (key: string) => {
        if (!menuDragKey) return;
        menuDragStateRef.current.overKey = key;
        setMenuDragOverKey(key);
    };

    // Column drag-to-reorder state (header)
    const [dragColIdx, setDragColIdx] = useState<number | null>(null);
    const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);
    const dragColStateRef = useRef<{ fromIdx: number; overIdx: number | null }>({ fromIdx: -1, overIdx: null });

    const handleColDragStart = (i: number, e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        let started = false;
        dragColStateRef.current = { fromIdx: i, overIdx: null };

        const onMove = (ev: MouseEvent) => {
            if (!started && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 5) {
                started = true;
                setDragColIdx(i);
                if (scrollContainerRef.current) scrollContainerRef.current.style.overflow = "hidden";
            }
        };

        const onUp = () => {
            if (scrollContainerRef.current) scrollContainerRef.current.style.overflow = "";
            if (started) {
                const { fromIdx, overIdx } = dragColStateRef.current;
                if (overIdx !== null && overIdx !== fromIdx) {
                    setColOrder((prev) => {
                        const visibleKeys = prev.filter((k) => visibleCols.has(k));
                        const fromKey = visibleKeys[fromIdx];
                        const toKey = visibleKeys[overIdx];
                        if (!fromKey || !toKey) return prev;
                        const next = [...prev];
                        next.splice(next.indexOf(fromKey), 1);
                        next.splice(next.indexOf(toKey), 0, fromKey);
                        return next;
                    });
                }
            }
            started = false;
            setDragColIdx(null);
            setDragOverColIdx(null);
            dragColStateRef.current = { fromIdx: -1, overIdx: null };
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    };

    const handleColDragEnter = (i: number) => {
        if (dragColIdx === null) return;
        dragColStateRef.current.overIdx = i;
        setDragOverColIdx(i);
    };

    // Column widths (resizable, initialized from persisted prefs)
    const [colWidths, setColWidths] = useState<Record<string, number>>(
        () => savedColWidths[title] ?? {},
    );
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

        const isLastHandle = colIdx === activeCols.length - 2;

        if (isLastHandle) {
            // Special case: handle on the left of the last column.
            // Drag left → last column grows from the left; drag right → shrinks.
            // Nothing to the left changes. Scroll right to keep the right edge in place.
            const lastCol = activeCols[activeCols.length - 1];
            const lastStartW = snap[lastCol.key];
            let prevW = lastStartW;
            let finalSnap = snap;

            const onMove = (ev: MouseEvent) => {
                const diff = ev.clientX - startX;
                const lastW = Math.max(40, lastStartW - diff); // inverted
                const delta = lastW - prevW;
                prevW = lastW;
                finalSnap = { ...finalSnap, [lastCol.key]: lastW };
                setColWidths((prev) => ({ ...prev, [lastCol.key]: lastW }));
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft += delta;
                }
            };
            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                saveColWidths(title, finalSnap);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
            return;
        }

        const leftKey = activeCols[colIdx].key;
        const leftStartW = snap[leftKey];
        let finalLeftW = leftStartW;

        const onMove = (ev: MouseEvent) => {
            const diff = ev.clientX - startX;
            finalLeftW = Math.max(40, leftStartW + diff);
            setColWidths((prev) => ({ ...prev, [leftKey]: finalLeftW }));
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            saveColWidths(title, { ...snap, [leftKey]: finalLeftW });
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
    const [ctxAiLoading, setCtxAiLoading] = useState(false);

    useEffect(() => {
        if (!ctxMenu) return;
        const handler = (e: MouseEvent) => {
            if (ctxRef.current && !ctxRef.current.contains(e.target as Node))
                setCtxMenu(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [ctxMenu]);

    // Clamp context menu to viewport after it renders
    useEffect(() => {
        if (!ctxMenu || !ctxRef.current) return;
        const rect = ctxRef.current.getBoundingClientRect();
        const pad = 6;
        let x = ctxMenu.x;
        let y = ctxMenu.y;
        if (rect.right > window.innerWidth - pad) x = window.innerWidth - rect.width - pad;
        if (rect.bottom > window.innerHeight - pad) y = window.innerHeight - rect.height - pad;
        if (x !== ctxMenu.x || y !== ctxMenu.y) setCtxMenu((prev) => prev ? { ...prev, x, y } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctxMenu?.x, ctxMenu?.y]);

    const handleContextMenu = (e: React.MouseEvent, colKey: string, rowItem: T | null, isNewRow = false, draftId?: string) => {
        e.preventDefault();
        const td = (e.target as HTMLElement).closest("td, th");
        const cellText = td?.textContent?.trim() ?? "";
        setCtxMenu({ x: e.clientX, y: e.clientY, colKey, rowItem: rowItem as unknown, cellText, isNewRow, draftId });
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
        if (ctxMenu?.rowItem && onEdit) onEdit(ctxMenu.rowItem as T);
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

    // ── Single-cell edit ────────────────────────────────────────────────
    const [editingCell, setEditingCell] = useState<{ id: string | number; colKey: string } | null>(null);
    const [editingCellValue, setEditingCellValue] = useState<string>("");
    const suppressNextBlurRef = useRef(false);
    const editingCellElRef = useRef<HTMLTableCellElement | null>(null);
    const [editingCellPos, setEditingCellPos] = useState<{ top: number; left: number } | null>(null);

    const measureEditingCell = useCallback(() => {
        if (!editingCellElRef.current) return;
        const r = editingCellElRef.current.getBoundingClientRect();
        setEditingCellPos({ top: r.top, left: r.right });
    }, []);

    useEffect(() => {
        if (!editingCell) { setEditingCellPos(null); return; }
        measureEditingCell();
        window.addEventListener("scroll", measureEditingCell, true);
        window.addEventListener("resize", measureEditingCell);
        return () => {
            window.removeEventListener("scroll", measureEditingCell, true);
            window.removeEventListener("resize", measureEditingCell);
        };
    }, [editingCell, measureEditingCell]);

    const ctxEditCell = () => {
        if (!ctxMenu?.rowItem || !onSaveEdits) return;
        const col = columns.find((c) => c.key === ctxMenu.colKey);
        if (!col?.editable) return;
        const item = ctxMenu.rowItem as T;
        const id = getRowId(item);
        if (col.editType === "markdown") {
            openMarkdownPanel(id, col.key);
            closeCtx();
            return;
        }
        if (col.editType === "images") {
            openImagePanel(id, col.key);
            closeCtx();
            return;
        }
        const editRow = editValues.get(id);
        const initVal = editRow && col.key in editRow
            ? String(editRow[col.key] ?? "")
            : col.getValue ? String(col.getValue(item)) : "";
        setEditingCell({ id, colKey: ctxMenu.colKey });
        setEditingCellValue(initVal);
        closeCtx();
    };

    const ctxAiFillCell = async () => {
        if (!ctxMenu || ctxAiLoading) return;
        const col = columns.find((c) => c.key === ctxMenu.colKey);
        if (!col?.editable || !col.aiGenerate) return;
        if (ctxMenu.isNewRow) {
            if (!ctxMenu.draftId) return;
            closeCtx();
            handleNewRowAiGenerate(col, ctxMenu.draftId);
            return;
        }
        if (!ctxMenu.rowItem || !onSaveEdits) return;
        const item = ctxMenu.rowItem as T;
        const id = getRowId(item);
        setCtxAiLoading(true);
        try {
            const result = await col.aiGenerate(item);
            if (col.editType === "tags") {
                const match = result.match(/\[[\s\S]*\]/);
                const tags: string[] = match ? JSON.parse(match[0]) : [];
                setEditCell(id, col.key, tags);
            } else {
                setEditCell(id, col.key, result);
            }
        } catch (e) {
            alert("AI error: " + e);
        } finally {
            setCtxAiLoading(false);
            closeCtx();
        }
    };

    const handleNewRowAiGenerate = async (col: Column<T>, draftId: string) => {
        const draft = draftRows.find(d => d.id === draftId);
        if (!col.aiGenerate || !draft || draft.aiLoading[col.key]) return;
        updateDraft(draftId, d => ({ ...d, aiLoading: { ...d.aiLoading, [col.key]: true } }));
        try {
            const result = await col.aiGenerate(draft.values as unknown as T);
            if (col.editType === "tags") {
                const match = result.match(/\[[\s\S]*\]/);
                const tags: string[] = match ? JSON.parse(match[0]) : [];
                updateDraft(draftId, d => ({ ...d, values: { ...d.values, [col.key]: tags } }));
            } else {
                updateDraft(draftId, d => ({ ...d, values: { ...d.values, [col.key]: result } }));
            }
        } catch (e) {
            alert("AI error: " + e);
        } finally {
            updateDraft(draftId, d => ({ ...d, aiLoading: { ...d.aiLoading, [col.key]: false } }));
        }
    };

    const handleFillRowWithAi = async (draftId: string) => {
        const draft = draftRows.find(d => d.id === draftId);
        if (!draft || draft.fillAiLoading || !isDraftAiReady(draft)) return;
        const aiCols = columns.filter((c) => c.editable && c.aiGenerate && c.editType !== "images");
        if (aiCols.length === 0) return;
        updateDraft(draftId, d => ({
            ...d,
            fillAiLoading: true,
            aiLoading: Object.fromEntries(aiCols.map((c) => [c.key, true])),
        }));
        const partialItem = draft.values as unknown as T;
        const results = await Promise.allSettled(
            aiCols.map(async (col) => ({ col, result: await col.aiGenerate!(partialItem) }))
        );
        const updates: Record<string, string | string[]> = {};
        for (const r of results) {
            if (r.status === "fulfilled") {
                const { col, result } = r.value;
                if (col.editType === "tags") {
                    const match = result.match(/\[[\s\S]*\]/);
                    updates[col.key] = match ? JSON.parse(match[0]) : [];
                } else {
                    updates[col.key] = result;
                }
            }
        }
        updateDraft(draftId, d => ({ ...d, values: { ...d.values, ...updates }, aiLoading: {}, fillAiLoading: false }));
    };

    const saveCellEdit = (andMoveDown = false) => {
        if (!editingCell) return;
        const { id, colKey } = editingCell;
        const col = columns.find((c) => c.key === colKey);
        if (!col) { setEditingCell(null); return; }
        // Tags handle their own saves via onChange; just close
        if (col.editType === "tags") { setEditingCell(null); return; }
        let value: unknown = editingCellValue;
        if (col.editType === "number") value = Number(editingCellValue);
        setEditCell(id, colKey, value);
        if (andMoveDown) {
            const rowIds = data.map(item => getRowId(item));
            const nextId = rowIds[rowIds.findIndex(rid => rid === id) + 1];
            const nextItem = nextId !== undefined ? data.find(item => getRowId(item) === nextId) : undefined;
            if (nextItem) {
                const queuedRow = editValues.get(nextId!);
                const initVal = queuedRow && colKey in queuedRow
                    ? String(queuedRow[colKey] ?? "")
                    : col.getValue ? String(col.getValue(nextItem)) : "";
                suppressNextBlurRef.current = true;
                setEditingCell({ id: nextId!, colKey });
                setEditingCellValue(initVal);
                return;
            }
        }
        setEditingCell(null);
    };

    const cancelCellEdit = () => setEditingCell(null);

    // Helper: should a column wrap?
    const shouldWrap = (key: string) => colWrapOverrides[key] ?? wrapMode;

    // ── Mobile header menu ────────────────────────────────────────────────
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileMenuPos, setMobileMenuPos] = useState({ top: 0, right: 0 });
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const mobileBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node))
                setMobileMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [mobileMenuOpen]);

    // ── Sort ─────────────────────────────────────────────────────────────
    const [sortMenuCol, setSortMenuCol] = useState<string | null>(null);
    const [sortMenuPos, setSortMenuPos] = useState({ top: 0, left: 0 });
    const sortMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!sortMenuCol) return;
        const handler = (e: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node))
                setSortMenuCol(null);
        };
        const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setSortMenuCol(null); };
        document.addEventListener("mousedown", handler);
        document.addEventListener("keydown", keyHandler);
        return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", keyHandler); };
    }, [sortMenuCol]);

    const openSortMenu = (col: Column<T>, btn: HTMLButtonElement) => {
        const rect = btn.getBoundingClientRect();
        setSortMenuPos({ top: rect.bottom + 2, left: rect.left });
        setSortMenuCol(col.sortKey ?? col.key);
    };

    const applySortDir = (dir: "asc" | "desc") => {
        if (sortMenuCol && onSortChange) onSortChange(sortMenuCol, dir);
        setSortMenuCol(null);
    };

    // ── Inline edit mode ────────────────────────────────────────────────
    const [isEditMode, setIsEditMode] = useState(false);
    const [editValues, setEditValues] = useState<Map<string | number, Record<string, unknown>>>(new Map());
    const [focusedEditCell, setFocusedEditCell] = useState<{ id: string | number; colKey: string } | null>(null);
    const [commitModalOpen, setCommitModalOpen] = useState(false);
    const [commitResults, setCommitResults] = useState<CommitResult[]>([]);
    const [isCommitting, setIsCommitting] = useState(false);
    const [commitDone, setCommitDone] = useState(false);

    const dirtyCount = Array.from(editValues.values()).filter(p => Object.keys(p).length > 0).length;

    // ── Draft rows ───────────────────────────────────────────────────────
    const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
    const [rowClipboard, setRowClipboard] = useState<Record<string, string | string[]> | null>(null);

    const updateDraft = (draftId: string, updater: (d: DraftRow) => DraftRow) =>
        setDraftRows(prev => prev.map(d => d.id === draftId ? updater(d) : d));

    const isDraftAiReady = (draft: DraftRow) =>
        !aiRequiredFields || aiRequiredFields.every((key) => {
            const val = draft.values[key];
            return Array.isArray(val) ? val.length > 0 : Boolean(val);
        });

    // ── Page-size picker ─────────────────────────────────────────────────
    const PAGE_SIZE_PRESETS = [10, 25, 50, 100];
    const isCustomPageSize = !PAGE_SIZE_PRESETS.includes(pageSize);
    const [pageSizeDropOpen, setPageSizeDropOpen] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(isCustomPageSize);
    const [customPageSize, setCustomPageSize] = useState(isCustomPageSize ? String(pageSize) : "");
    const pageSizeDropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!pageSizeDropOpen) return;
        const handler = (e: MouseEvent) => {
            if (pageSizeDropRef.current && !pageSizeDropRef.current.contains(e.target as Node))
                setPageSizeDropOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [pageSizeDropOpen]);

    const totalPending = dirtyCount + draftRows.length;

    const enterEditMode = () => { setIsEditMode(true); };
    // Exit edit mode but keep queued changes (commit bar remains visible)
    const exitEditMode = () => { setIsEditMode(false); setFocusedEditCell(null); };
    // Discard all queued changes and exit edit mode
    const discardChanges = () => { setEditValues(new Map()); setIsEditMode(false); setFocusedEditCell(null); setEditingCell(null); setDraftRows([]); };

    const navigateEditCell = (fromId: string | number, fromColKey: string, direction: "up" | "down" | "left" | "right") => {
        const editableCols = activeCols.filter(c => c.editable);
        const rowIds = data.map(item => getRowId(item));
        const rowIdx = rowIds.findIndex(rid => rid === fromId);
        const colIdx = editableCols.findIndex(c => c.key === fromColKey);
        if (rowIdx === -1 || colIdx === -1) return;

        let targetRowIdx = rowIdx;
        let targetColIdx = colIdx;

        switch (direction) {
            case "up":    targetRowIdx = Math.max(0, rowIdx - 1); break;
            case "down":  targetRowIdx = Math.min(rowIds.length - 1, rowIdx + 1); break;
            case "left":
                if (colIdx > 0) targetColIdx = colIdx - 1;
                else if (rowIdx > 0) { targetRowIdx = rowIdx - 1; targetColIdx = editableCols.length - 1; }
                break;
            case "right":
                if (colIdx < editableCols.length - 1) targetColIdx = colIdx + 1;
                else if (rowIdx < rowIds.length - 1) { targetRowIdx = rowIdx + 1; targetColIdx = 0; }
                break;
        }

        const targetId = rowIds[targetRowIdx];
        const targetKey = editableCols[targetColIdx]?.key;
        if (targetId === undefined || !targetKey) return;
        const el = document.querySelector<HTMLElement>(`[data-editcell="${String(targetId)}:${targetKey}"]`);
        if (el) { el.focus(); el.scrollIntoView({ block: "nearest", inline: "nearest" }); }
    };

    const setEditCell = (id: string | number, colKey: string, value: unknown) => {
        if (typeof id === "string" && id.startsWith("__new__")) {
            const draftId = id.slice(7);
            updateDraft(draftId, d => ({ ...d, values: { ...d.values, [colKey]: value as string | string[] } }));
            return;
        }
        setEditValues((prev) => {
            const next = new Map(prev);
            const row = { ...(next.get(id) ?? {}) };
            row[colKey] = value;
            next.set(id, row);
            return next;
        });
    };

    const openCommitModal = () => {
        const results: CommitResult[] = [];
        for (const [id, patch] of editValues.entries()) {
            const keys = Object.keys(patch);
            if (keys.length === 0) continue;
            const original = data.find(item => getRowId(item) === id);
            const changes: CommitChange[] = keys.map(key => {
                const col = columns.find(c => c.key === key);
                const fromVal = (() => {
                    if (!original) return "—";
                    if (col?.getTagsValue)   return col.getTagsValue(original).join(", ") || "—";
                    if (col?.getImagesValue) return `${col.getImagesValue(original).length} image(s)`;
                    if (col?.getValue)       return String(col.getValue(original));
                    return "—";
                })();
                const rawTo = patch[key];
                const toVal = Array.isArray(rawTo)
                    ? col?.editType === "images"
                        ? `${(rawTo as string[]).length} image(s)`
                        : (rawTo as string[]).join(", ")
                    : String(rawTo ?? "");
                return { key, label: col?.label ?? key, from: fromVal, to: toVal };
            });
            results.push({ id, changes, status: "idle" });
        }
        if (onCreateRow) {
            for (const draft of draftRows) {
                const changes = activeCols
                    .filter(c => c.editable && draft.values[c.key])
                    .map(c => {
                        const val = draft.values[c.key];
                        const to = Array.isArray(val)
                            ? c.editType === "images" ? `${val.length} image(s)` : val.join(", ")
                            : String(val ?? "");
                        return { key: c.key, label: c.label, from: "—", to };
                    });
                results.push({ id: `__new__${draft.id}`, changes, status: "idle" });
            }
        }
        if (results.length === 0) return;
        setCommitResults(results);
        setCommitDone(false);
        setCommitModalOpen(true);
    };

    const handleCommit = async () => {
        setIsCommitting(true);
        setCommitResults(prev => prev.map(r => ({ ...r, status: "saving" as const })));
        const tasks: Promise<void>[] = [];
        if (onSaveEdits) {
            const edits = commitResults
                .filter(r => !(typeof r.id === "string" && r.id.startsWith("__new__")))
                .map(result => {
                    const original = data.find(item => getRowId(item) === result.id);
                    const patch = editValues.get(result.id);
                    if (!original || !patch || Object.keys(patch).length === 0) return null;
                    return { id: result.id, original, patch } as RowEdit<T>;
                })
                .filter(Boolean) as RowEdit<T>[];
            tasks.push(...edits.map(edit =>
                onSaveEdits([edit])
                    .then(() => setCommitResults(prev => prev.map(r => r.id === edit.id ? { ...r, status: "success" as const } : r)))
                    .catch((e: unknown) => setCommitResults(prev => prev.map(r => r.id === edit.id ? { ...r, status: "error" as const, error: String(e) } : r)))
            ));
        }
        if (onCreateRow) {
            for (const result of commitResults) {
                if (typeof result.id !== "string" || !result.id.startsWith("__new__")) continue;
                const draftId = result.id.slice(7);
                const draft = draftRows.find(d => d.id === draftId);
                if (!draft) continue;
                tasks.push(
                    onCreateRow(draft.values)
                        .then(() => {
                            setCommitResults(prev => prev.map(r => r.id === result.id ? { ...r, status: "success" as const } : r));
                            setDraftRows(prev => prev.filter(d => d.id !== draftId));
                        })
                        .catch((e: unknown) => setCommitResults(prev => prev.map(r => r.id === result.id ? { ...r, status: "error" as const, error: String(e) } : r)))
                );
            }
        }
        await Promise.all(tasks);
        setIsCommitting(false);
        setCommitDone(true);
    };

    const closeCommitModal = () => {
        const allSucceeded = commitDone && commitResults.every(r => r.status === "success");
        const successIds = new Set(commitResults.filter(r => r.status === "success").map(r => r.id));
        setCommitModalOpen(false);
        setCommitResults([]);
        setCommitDone(false);
        if (allSucceeded) {
            setIsEditMode(false);
            setEditValues(new Map());
            setFocusedEditCell(null);
        } else if (commitDone && successIds.size > 0) {
            setEditValues(prev => {
                const next = new Map(prev);
                successIds.forEach(id => next.delete(id));
                return next;
            });
        }
    };

    // ── Export ──────────────────────────────────────────────────────────
    const exportFilename = (ext: string) => safeFilename(title, `page${page}.${ext}`);

    const generateCsv = (): string => {
        const headers = activeCols.map(c => c.label);
        const rows = data.map(item =>
            activeCols.map(c => {
                if (c.getValue) return c.getValue(item);
                const val = (item as Record<string, unknown>)[c.key];
                return typeof val === "object" && val !== null ? JSON.stringify(val) : val;
            })
        );
        return buildCsv(headers, rows);
    };

    const handleExportCsv = () =>
        downloadData(generateCsv(), "text/csv;charset=utf-8;", exportFilename("csv"));

    const handleExportJson = () =>
        downloadData(JSON.stringify(data, null, 2), "application/json", exportFilename("json"));

    const handleCopyCsv = async () => {
        try { await navigator.clipboard.writeText(generateCsv()); } catch { /* ignore */ }
    };

    const handlePrint = () => window.print();

    // ── CSV import ───────────────────────────────────────────────────────
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importText, setImportText] = useState("");
    const [importError, setImportError] = useState<string | null>(null);
    type ImportDuplicate = { id: string | number; values: Record<string, string | string[]> };
    const [importDuplicates, setImportDuplicates] = useState<ImportDuplicate[]>([]);
    const [importPending, setImportPending] = useState<{ newDrafts: DraftRow[]; duplicates: ImportDuplicate[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const applyImportCsv = (text: string) => {
        const rows = parseCsv(text.trim());
        if (rows.length < 2) { setImportError("CSV must have a header row and at least one data row."); return; }
        const headers = rows[0].map(h => h.trim().toLowerCase());
        const labelToKey: Record<string, string> = {};
        for (const col of columns) {
            labelToKey[col.label.trim().toLowerCase()] = col.key;
        }
        const dataRows = rows.slice(1).filter(r => r.some(cell => cell.trim() !== ""));
        if (dataRows.length === 0) { setImportError("No data rows found."); return; }

        // Build a set of existing row IDs for fast lookup
        const existingIdMap = new Map<string, string | number>();
        for (const item of data) {
            existingIdMap.set(String(getRowId(item)).toLowerCase(), getRowId(item));
        }

        const newDrafts: DraftRow[] = [];
        const duplicates: ImportDuplicate[] = [];

        dataRows.forEach((row, i) => {
            const values: Record<string, string | string[]> = {};
            headers.forEach((header, hi) => {
                const key = labelToKey[header];
                if (!key || row[hi] === undefined) return;
                const col = columns.find(c => c.key === key);
                if (col?.editType === "tags") {
                    try { values[key] = JSON.parse(row[hi]); }
                    catch { values[key] = row[hi] ? row[hi].split(",").map(s => s.trim()).filter(Boolean) : []; }
                } else {
                    values[key] = row[hi];
                }
            });

            // Check importMatchKey first (VIN-style matching)
            let matchedId: string | number | undefined;
            if (importMatchKey && values[importMatchKey] !== undefined) {
                const matchVal = String(values[importMatchKey]).trim().toLowerCase();
                const matchedItem = data.find(item => {
                    const col = columns.find(c => c.key === importMatchKey);
                    const cellVal = col?.getValue ? col.getValue(item) : (item as Record<string, unknown>)[importMatchKey];
                    return String(cellVal ?? "").trim().toLowerCase() === matchVal;
                });
                if (matchedItem) matchedId = getRowId(matchedItem);
            }

            // Check if the locked (ID) column value matches an existing row ID
            if (matchedId === undefined) {
                const lockedKeys = new Set(columns.filter(c => c.locked).map(c => c.key));
                for (const [key, val] of Object.entries(values)) {
                    if (!lockedKeys.has(key)) continue;
                    const strVal = String(val).trim().toLowerCase();
                    if (strVal && existingIdMap.has(strVal)) {
                        matchedId = existingIdMap.get(strVal)!;
                        break;
                    }
                }
            }

            if (matchedId !== undefined) {
                duplicates.push({ id: matchedId, values });
            } else {
                newDrafts.push({ id: `import_${Date.now()}_${i}`, values, aiLoading: {}, fillAiLoading: false });
            }
        });

        if (duplicates.length > 0) {
            // Stage for user confirmation
            setImportPending({ newDrafts, duplicates });
            setImportDuplicates(duplicates);
        } else {
            commitImportResult(newDrafts, []);
        }
    };

    const commitImportResult = (newDrafts: DraftRow[], duplicatesToEdit: ImportDuplicate[]) => {
        if (duplicatesToEdit.length > 0) {
            setEditValues(prev => {
                const next = new Map(prev);
                for (const { id, values } of duplicatesToEdit) {
                    const patch = { ...(next.get(id) ?? {}) };
                    for (const [key, val] of Object.entries(values)) {
                        const col = columns.find(c => c.key === key);
                        if (!col?.editable) continue;
                        if (permanentlyLockedCols?.includes(key)) continue;
                        patch[key] = val;
                    }
                    next.set(id, patch);
                }
                return next;
            });
        }
        setVisibleCols(new Set(columns.map(c => c.key)));
        if (newDrafts.length > 0) setDraftRows(prev => [...prev, ...newDrafts]);
        // Show all rows so imported/edited rows are immediately visible
        const total = totalItems + newDrafts.length;
        if (total > pageSize) onPageSizeChange(total);
        setImportModalOpen(false);
        setImportText("");
        setImportError(null);
        setImportPending(null);
        setImportDuplicates([]);
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            applyImportCsv(text);
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const exportOptions: ExportOption[] = [
        { label: "CSV",              icon: <BiTable />,   onClick: handleExportCsv,  disabled: data.length === 0 },
        { label: "JSON",             icon: <BiCode />,    onClick: handleExportJson,  disabled: data.length === 0 },
        { label: "Copy as CSV",      icon: <BiCopy />,    onClick: handleCopyCsv,     disabled: data.length === 0, divider: true },
        { label: "Print",            icon: <BiPrinter />, onClick: handlePrint },
        ...(onCreateRow ? [
            { label: "Import CSV File",  icon: <BiUpload />,  onClick: () => fileInputRef.current?.click(), divider: true, section: "Import" },
            { label: "Paste CSV",        icon: <BiClipboard />, onClick: () => { setImportText(""); setImportError(null); setImportModalOpen(true); } },
        ] : []),
    ];

    // ── Preview panel ────────────────────────────────────────────────────
    const [panelOpen, setPanelOpen] = useState(false);
    const [panelWidth, setPanelWidth] = useState(360);
    const [previewItem, setPreviewItem] = useState<T | null>(null);

    const handlePanelResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = panelWidth;
        const onMove = (ev: MouseEvent) => {
            const diff = startX - ev.clientX;
            setPanelWidth(Math.max(200, Math.min(window.innerWidth * 0.75, startWidth + diff)));
        };
        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    };

    const togglePanel = () => {
        setPanelOpen((o) => {
            if (o) setPreviewItem(null);
            else { setMarkdownPanelOpen(false); setImagePanelOpen(false); }
            return !o;
        });
    };

    // ── Markdown editor panel ────────────────────────────────────────────
    const [markdownPanelOpen, setMarkdownPanelOpen] = useState(false);
    const [markdownPanelRowId, setMarkdownPanelRowId] = useState<string | number | null>(null);
    const [markdownPanelColKey, setMarkdownPanelColKey] = useState<string | null>(null);
    const [markdownTab, setMarkdownTab] = useState<"write" | "preview">("write");
    const [markdownPanelWidth, setMarkdownPanelWidth] = useState(500);
    const [markdownAiLoading, setMarkdownAiLoading] = useState(false);

    const openMarkdownPanel = (rowId: string | number, colKey: string) => {
        setMarkdownPanelRowId(rowId);
        setMarkdownPanelColKey(colKey);
        setMarkdownTab("write");
        setMarkdownPanelOpen(true);
        setImagePanelOpen(false);
        setPanelOpen(false);
    };

    const closeMarkdownPanel = () => setMarkdownPanelOpen(false);

    const handleMarkdownAiGenerate = async () => {
        if (markdownPanelRowId === null || !markdownPanelColKey || markdownAiLoading) return;
        const col = columns.find(c => c.key === markdownPanelColKey);
        if (!col?.aiGenerate) return;
        const rowIdStr = String(markdownPanelRowId);
        const isDraftRow = rowIdStr.startsWith("__new__");
        const draftId = isDraftRow ? rowIdStr.slice(7) : null;
        const draft = draftId ? draftRows.find(d => d.id === draftId) : null;
        const item = isDraftRow
            ? (draft ? (draft.values as unknown as T) : null)
            : data.find(d => getRowId(d) === markdownPanelRowId);
        if (!item) return;
        setMarkdownAiLoading(true);
        try {
            const result = await col.aiGenerate(item);
            if (isDraftRow && draftId) {
                updateDraft(draftId, d => ({ ...d, values: { ...d.values, [markdownPanelColKey]: result } }));
            } else {
                setEditCell(markdownPanelRowId, markdownPanelColKey, result);
            }
        } catch (e) {
            alert("AI error: " + e);
        } finally {
            setMarkdownAiLoading(false);
        }
    };

    const handleMarkdownPanelResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = markdownPanelWidth;
        const onMove = (ev: MouseEvent) => {
            const diff = startX - ev.clientX;
            setMarkdownPanelWidth(Math.max(280, Math.min(window.innerWidth * 0.75, startWidth + diff)));
        };
        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    };

    const markdownPanelCol = markdownPanelColKey ? columns.find(c => c.key === markdownPanelColKey) : undefined;
    const markdownPanelValue = (() => {
        if (markdownPanelRowId === null || !markdownPanelColKey) return "";
        const rowIdStr = String(markdownPanelRowId);
        if (rowIdStr.startsWith("__new__")) {
            const draftId = rowIdStr.slice(7);
            const draft = draftRows.find(d => d.id === draftId);
            return String(draft?.values[markdownPanelColKey] ?? "");
        }
        const editRow = editValues.get(markdownPanelRowId);
        if (editRow && markdownPanelColKey in editRow) return String(editRow[markdownPanelColKey] ?? "");
        const mdItem = data.find(d => getRowId(d) === markdownPanelRowId);
        return markdownPanelCol?.getValue && mdItem ? String(markdownPanelCol.getValue(mdItem)) : "";
    })();

    // ── Image editor panel ───────────────────────────────────────────────
    const [imagePanelOpen, setImagePanelOpen] = useState(false);
    const [imagePanelRowId, setImagePanelRowId] = useState<string | number | null>(null);
    const [imagePanelColKey, setImagePanelColKey] = useState<string | null>(null);
    const [imagePanelWidth, setImagePanelWidth] = useState(420);

    const openImagePanel = (rowId: string | number, colKey: string) => {
        setImagePanelRowId(rowId);
        setImagePanelColKey(colKey);
        setImagePanelOpen(true);
        setMarkdownPanelOpen(false);
        setPanelOpen(false);
    };

    const closeImagePanel = () => setImagePanelOpen(false);

    const handleImagePanelResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = imagePanelWidth;
        const onMove = (ev: MouseEvent) => {
            const diff = startX - ev.clientX;
            setImagePanelWidth(Math.max(280, Math.min(window.innerWidth * 0.75, startWidth + diff)));
        };
        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    };

    const imagePanelCol = imagePanelColKey ? columns.find(c => c.key === imagePanelColKey) : undefined;
    const imagePanelValue = (() => {
        if (imagePanelRowId === null || !imagePanelColKey) return [] as string[];
        const rowIdStr = String(imagePanelRowId);
        if (rowIdStr.startsWith("__new__")) {
            const draftId = rowIdStr.slice(7);
            const draft = draftRows.find(d => d.id === draftId);
            return (draft?.values[imagePanelColKey] as string[]) ?? [];
        }
        const editRow = editValues.get(imagePanelRowId);
        if (editRow && imagePanelColKey in editRow) return editRow[imagePanelColKey] as string[];
        const imgItem = data.find(d => getRowId(d) === imagePanelRowId);
        return imagePanelCol?.getImagesValue && imgItem ? imagePanelCol.getImagesValue(imgItem) : [];
    })();

    const setImagePanelImages = (imgs: string[]) => {
        if (imagePanelRowId === null || !imagePanelColKey) return;
        const rowIdStr = String(imagePanelRowId);
        if (rowIdStr.startsWith("__new__")) {
            const draftId = rowIdStr.slice(7);
            updateDraft(draftId, d => ({ ...d, values: { ...d.values, [imagePanelColKey]: imgs } }));
        } else {
            setEditCell(imagePanelRowId, imagePanelColKey, imgs);
        }
    };

    // ── Fullscreen overlay ───────────────────────────────────────────────
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ── Filter side panel ─────────────────────────────────────────────────
    const filterBtnRef = useRef<HTMLButtonElement>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterPanelWidth, setFilterPanelWidth] = useState(280);

    const openFilter = () => setFilterOpen((o) => !o);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsFullscreen(false);
                setPanelOpen(false);
                setMarkdownPanelOpen(false);
                setImagePanelOpen(false);
                setFilterOpen(false);
            }
        };
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
        if (target.closest("button, input, a, select, label, th")) return;
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
            <div className={`${styles.topBar} ${isEditMode ? styles.topBarEditMode : ""}`}>
                <button
                    onClick={toggleFullscreen}
                    className={`${styles.btnIcon} ${isFullscreen ? styles.btnIconActive : ""}`}
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                    {isFullscreen ? <BiExitFullscreen /> : <BiFullscreen />}
                </button>
                <h2 className={styles.topTitle}>{title}</h2>
                {isEditMode && (
                    <span className={styles.editModeBadge}>EDITING</span>
                )}
                {subtitle && !isEditMode && <span className={styles.topSubtitle}>{subtitle}</span>}
                <div style={{ flex: 1 }} />

                {/* ── Desktop buttons ──────────────────────────────────── */}
                <div className={styles.headerBtns}>
                    {isEditMode ? (
                        <>
                            {headerActions}
                            <ExportButton options={exportOptions} disabled={data.length === 0} btnClassName={styles.btnIcon} />
                            <button ref={searchBtnRef} onClick={() => openSearch()} className={`${styles.btnIcon} ${searchOpen ? styles.btnIconActive : ""}`} title="Search"><BiSearch /></button>
                            <button onClick={onRefresh} disabled={loading || refreshing} className={styles.btnIcon} title="Refresh"><BiRefresh className={refreshing ? styles.spinning : ""} /></button>
                            <button ref={menuBtnRef} onClick={() => openColMenu()} className={`${styles.btnIcon} ${colMenuOpen ? styles.btnIconActive : ""}`} title="Columns"><BiMenu /></button>
                            {renderPreview && <button onClick={togglePanel} className={`${styles.btnIcon} ${panelOpen ? styles.btnIconActive : ""}`} title="Preview"><BiColumns /></button>}
                            <button onClick={exitEditMode} className={styles.btnIcon} title="Exit edit mode"><BiX /></button>
                        </>
                    ) : (
                        <>
                            {headerActions}
                            <ExportButton options={exportOptions} disabled={data.length === 0} btnClassName={styles.btnIcon} />
                            {onSaveEdits && <button onClick={enterEditMode} className={styles.btnIcon} title="Edit mode" disabled={data.length === 0}><BiPencil /></button>}
                            {filterableColumns && filterableColumns.length > 0 && (
                                <button
                                    ref={filterBtnRef}
                                    onClick={() => openFilter()}
                                    className={`${styles.btnIcon} ${filterOpen ? styles.btnIconActive : ""} ${activeFilters?.length ? styles.btnIconBadge : ""}`}
                                    title="Filter"
                                    data-count={activeFilters?.length || undefined}
                                >
                                    <BiFilter />
                                </button>
                            )}
                            <button ref={searchBtnRef} onClick={() => openSearch()} className={`${styles.btnIcon} ${searchOpen ? styles.btnIconActive : ""}`} title="Search"><BiSearch /></button>
                            <button onClick={onRefresh} disabled={loading || refreshing} className={styles.btnIcon} title="Refresh"><BiRefresh className={refreshing ? styles.spinning : ""} /></button>
                            <button ref={menuBtnRef} onClick={() => openColMenu()} className={`${styles.btnIcon} ${colMenuOpen ? styles.btnIconActive : ""}`} title="Columns"><BiMenu /></button>
                            {renderPreview && <button onClick={togglePanel} className={`${styles.btnIcon} ${panelOpen ? styles.btnIconActive : ""}`} title="Preview"><BiColumns /></button>}
                        </>
                    )}
                </div>

                {/* ── Mobile 3-dots button ─────────────────────────────── */}
                <button
                    ref={mobileBtnRef}
                    className={styles.headerMobileBtn}
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMobileMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                        setMobileMenuOpen((o) => !o);
                    }}
                >
                    <BiDotsVerticalRounded />
                </button>
            </div>

            {/* ── Filter chips ─────────────────────────────────────────── */}
            {activeFilters && activeFilters.length > 0 && onFiltersChange && (
                <div className={styles.filterChipsBar}>
                    {activeFilters.map((f) => (
                        <button
                            key={f.id}
                            className={styles.filterChip}
                            onClick={() => setFilterOpen(true)}
                        >
                            {formatFilterLabel(f)}
                            <span
                                className={styles.filterChipX}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    onFiltersChange(activeFilters.filter((x) => x.id !== f.id));
                                }}
                            >
                                <BiX size={12} />
                            </span>
                        </button>
                    ))}
                    <button className={styles.filterChipClear} onClick={() => onFiltersChange([])}>
                        Clear filters
                    </button>
                </div>
            )}

            {/* ── Column menu popup ─────────────────────────────────────── */}
            {colMenuOpen && createPortal(
                <div
                    ref={colMenuRef}
                    className={styles.contextMenu}
                    style={{ top: colMenuPos.top, right: colMenuPos.right, left: "auto", maxHeight: 480, overflowY: "auto", minWidth: 200 }}
                >
                    <div className={styles.ctxSection}>Options</div>
                    <button className={styles.ctxItem} onClick={handleToggleWrap}>
                        <BiText />
                        {wrapMode ? "Disable Wrap" : "Enable Wrap"}
                    </button>
                    <div className={styles.ctxDivider} />
                    <div className={styles.colMenuHeader}>
                        <span className={styles.ctxSection} style={{ margin: 0 }}>Columns</span>
                        <div className={styles.colMenuActions}>
                            <button
                                className={styles.colMenuActionBtn}
                                onClick={() => setVisibleCols(new Set(columns.map((c) => c.key)))}
                                title="Show all columns"
                            >
                                <BiShow /> Show All
                            </button>
                            <button
                                className={styles.colMenuActionBtn}
                                onClick={() => {
                                    setVisibleCols(new Set(columns.filter((c) => c.defaultVisible).map((c) => c.key)));
                                    setColOrder(columns.map((c) => c.key));
                                }}
                                title="Reset to defaults"
                            >
                                <BiReset /> Reset
                            </button>
                        </div>
                    </div>
                    {orderedColumns.filter((col) => !col.newRowVisible).map((col) => (
                        <div
                            key={col.key}
                            className={[
                                styles.colMenuRow,
                                menuDragKey === col.key ? styles.colMenuRowDragging : "",
                                menuDragOverKey === col.key && menuDragKey !== col.key ? styles.colMenuRowDragOver : "",
                            ].filter(Boolean).join(" ")}
                            onMouseEnter={() => handleMenuDragEnter(col.key)}
                        >
                            <span
                                className={styles.colMenuHandle}
                                onMouseDown={() => handleMenuDragStart(col.key)}
                            >
                                <BiGridVertical />
                            </span>
                            <label className={styles.colMenuLabel}>
                                <input
                                    type="checkbox"
                                    checked={visibleCols.has(col.key)}
                                    onChange={() => toggleCol(col.key)}
                                    style={{ accentColor: "var(--color-accent)", cursor: "pointer", flexShrink: 0 }}
                                />
                                {col.label}
                            </label>
                            {col.editable && (
                                <button
                                    className={`${styles.colMenuLockBtn} ${isColLocked(col.key) ? styles.colMenuLockBtnActive : ""}`}
                                    onClick={() => toggleColLock(col.key)}
                                    title={isPermanentForRole(col.key) ? "Always locked" : isColLocked(col.key) ? "Unlock column" : "Lock column"}
                                    disabled={isPermanentForRole(col.key)}
                                >
                                    <BiLock />
                                </button>
                            )}
                        </div>
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
            {selected.size > 0 && onBulkDelete && (
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

            {/* ── Table + Preview panel ─────────────────────────────────── */}
            <div className={styles.bodyRow}>
            <div className={`${styles.scrollContainer} ${loading ? styles.scrollContainerLoading : ""}`} ref={scrollContainerRef} onMouseDown={handleScrollMouseDown}>
                {(loading || refreshing) && (
                    <div className={styles.refreshBar}>
                        <div className={styles.refreshBarFill} />
                    </div>
                )}
                {!loading && data.length === 0 ? (
                    <div className={styles.loadingOverlay}>{emptyMessage}</div>
                ) : (
                    <table
                        ref={tableRef}
                        className={styles.table}
                        style={isFixed ? (() => {
                            const lastCol = activeCols[activeCols.length - 1];
                            const lastColMin = lastCol
                                ? (colWidths[lastCol.key] ?? lastCol.minWidth ?? 120)
                                : 0;
                            const minW = (stickyColWidth ?? 0)
                                + activeCols.slice(0, -1).reduce((sum, col) => sum + (colWidths[col.key] ?? 0), 0)
                                + lastColMin;
                            return { tableLayout: "fixed", width: "100%", minWidth: minW };
                        })() : undefined}
                    >
                        <thead>
                            <tr>
                                <th
                                    className={styles.stickyCol}
                                    style={stickyColWidth ? { width: stickyColWidth } : undefined}
                                >
                                    <div className={styles.stickyColInner}>
                                        <span className={styles.dotsPlaceholder} />
                                        {onBulkDelete && (
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
                                {activeCols.map((col, i) => {
                                    const isSortable = !!onSortChange && !!col.getValue;
                                    const sortKey = col.sortKey ?? col.key;
                                    const isSorted = sortBy === sortKey;
                                    return (
                                        <th
                                            key={col.key}
                                            style={{
                                                width: i < activeCols.length - 1 ? (colWidths[col.key] || undefined) : undefined,
                                                minWidth: col.minWidth || undefined,
                                                cursor: dragColIdx !== null ? "grabbing" : "grab",
                                                opacity: dragColIdx === i ? 0.4 : 1,
                                                borderLeft: dragOverColIdx === i && dragColIdx !== null && dragColIdx !== i
                                                    ? "2px solid var(--color-accent)"
                                                    : undefined,
                                            }}
                                            onMouseDown={(e) => handleColDragStart(i, e)}
                                            onMouseEnter={() => handleColDragEnter(i)}
                                            onContextMenu={(e) => handleContextMenu(e, col.key, null)}
                                        >
                                            <div className={styles.thInner}>
                                                <span className={styles.colLabelText}>
                                                    {col.label}
                                                    {onSaveEdits && (!col.editable || isColLocked(col.key)) && (
                                                        <BiLock className={styles.colLockIcon} />
                                                    )}
                                                </span>
                                                {isSortable && (
                                                    <button
                                                        className={`${styles.sortBtn} ${isSorted ? styles.sortBtnActive : ""}`}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onClick={(e) => { e.stopPropagation(); openSortMenu(col, e.currentTarget); }}
                                                        title="Sort"
                                                    >
                                                        {isSorted && sortDir === "desc"
                                                            ? <PiSortAscending />
                                                            : <PiSortDescending />
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                            <span
                                                className={styles.resizeHandle}
                                                onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(i, e); }}
                                            />
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => {
                                const id = getRowId(item);
                                const isPreviewActive = panelOpen && renderPreview && previewItem && getRowId(previewItem) === id;
                                return (
                                    <tr
                                        key={String(id)}
                                        className={isPreviewActive ? styles.previewActiveRow : undefined}
                                        onClick={panelOpen && renderPreview ? () => setPreviewItem(item) : undefined}
                                        style={panelOpen && renderPreview ? { cursor: "pointer" } : undefined}
                                    >
                                        <td className={styles.stickyCol}>
                                            <div className={styles.stickyColInner}>
                                                <button
                                                    className={styles.dotsBtn}
                                                    onClick={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setCtxMenu({
                                                            x: rect.left,
                                                            y: rect.bottom + 2,
                                                            colKey: activeCols[0]?.key ?? "",
                                                            rowItem: item,
                                                            cellText: "",
                                                        });
                                                    }}
                                                >
                                                    <BiDotsVerticalRounded />
                                                </button>
                                                {onBulkDelete && (
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
                                            const editRow = editValues.get(id);
                                            const isDirty = editRow && col.key in editRow;
                                            const editVal = isDirty
                                                ? String(editRow![col.key] ?? "")
                                                : col.getValue
                                                ? String(col.getValue(item) ?? "")
                                                : "";
                                            const isCellEditing = editingCell?.id === id && editingCell?.colKey === col.key;
                                            const isEditModeFocused = focusedEditCell?.id === id && focusedEditCell?.colKey === col.key;
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={[
                                                        wrap ? styles.wrappedCell : undefined,
                                                        col.editable && !isColLocked(col.key) && isDirty ? styles.editedCell : undefined,
                                                        isCellEditing || isEditModeFocused ? styles.editingActiveCell : undefined,
                                                    ].filter(Boolean).join(" ") || undefined}
                                                    onContextMenu={(e) => handleContextMenu(e, col.key, item)}
                                                    onDoubleClick={(e) => {
                                                        if (!col.editable || isColLocked(col.key) || !onSaveEdits) return;
                                                        if (col.editType === "markdown") {
                                                            openMarkdownPanel(id, col.key);
                                                            return;
                                                        }
                                                        if (col.editType === "images") {
                                                            openImagePanel(id, col.key);
                                                            return;
                                                        }
                                                        if (isEditMode) return;
                                                        const initVal = editRow && col.key in editRow
                                                            ? String(editRow[col.key] ?? "")
                                                            : col.getValue ? String(col.getValue(item)) : "";
                                                        editingCellElRef.current = e.currentTarget as HTMLTableCellElement;
                                                        setEditingCell({ id, colKey: col.key });
                                                        setEditingCellValue(initVal);
                                                    }}
                                                >
                                                    {isCellEditing ? (
                                                        // ── Single-cell edit ──
                                                        col.editType === "tags" ? (() => {
                                                            const tagsVal: string[] = editRow && col.key in editRow
                                                                ? (editRow[col.key] as string[])
                                                                : (col.getTagsValue ? col.getTagsValue(item) : []);
                                                            return (
                                                                <TagsEditor
                                                                    tags={tagsVal}
                                                                    onChange={(tags) => setEditCell(id, col.key, tags)}
                                                                    onClose={() => setEditingCell(null)}
                                                                    onNavigateDown={() => {
                                                                        setEditingCell(null);
                                                                        const rowIds = data.map((d) => getRowId(d));
                                                                        const nextIdx = rowIds.findIndex((rid) => rid === id) + 1;
                                                                        if (nextIdx < rowIds.length)
                                                                            setEditingCell({ id: rowIds[nextIdx], colKey: col.key });
                                                                    }}
                                                                />
                                                            );
                                                        })() : col.editType === "textarea" ? (
                                                            <div className={styles.cellEditRow}>
                                                                <textarea
                                                                    className={styles.editInput}
                                                                    autoFocus
                                                                    value={editingCellValue}
                                                                    rows={2}
                                                                    onChange={(e) => setEditingCellValue(e.target.value)}
                                                                    onBlur={() => saveCellEdit()}
                                                                    onKeyDown={(e) => { if (e.key === "Escape") cancelCellEdit(); }}
                                                                />
                                                            </div>
                                                        ) : col.editType === "select" ? (
                                                            <div className={styles.cellEditRow}>
                                                                <div className={styles.editSelectWrapper} style={{ flex: 1 }}>
                                                                    {col.render({ ...item, [col.key]: editingCellValue } as T)}
                                                                    <select
                                                                        className={styles.editSelectOverlay}
                                                                        autoFocus
                                                                        value={editingCellValue}
                                                                        onChange={(e) => setEditingCellValue(e.target.value)}
                                                                        onBlur={() => saveCellEdit()}
                                                                        onKeyDown={(e) => { if (e.key === "Escape") cancelCellEdit(); }}
                                                                    >
                                                                        {col.editOptions?.map((opt) => (
                                                                            <option key={opt} value={opt}>{opt}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        ) : col.editType === "date" ? (
                                                            <div className={styles.cellEditRow}>
                                                                <DatePicker
                                                                    label={col.label}
                                                                    showLabel={false}
                                                                    allowPast
                                                                    autoOpen
                                                                    portal
                                                                    selected={editingCellValue ? new Date(editingCellValue + "T00:00:00") : undefined}
                                                                    onSelect={(date) => {
                                                                        if (date) {
                                                                            setEditCell(id, col.key, dateFnsFormat(date, "yyyy-MM-dd"));
                                                                            setEditingCell(null);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className={styles.cellEditRow}>
                                                                <input
                                                                    className={styles.editInput}
                                                                    autoFocus
                                                                    type={col.editType === "number" ? "number" : col.editType === "datetime-local" ? "datetime-local" : "text"}
                                                                    value={editingCellValue}
                                                                    onChange={(e) => setEditingCellValue(e.target.value)}
                                                                    onBlur={() => {
                                                                        if (suppressNextBlurRef.current) { suppressNextBlurRef.current = false; return; }
                                                                        saveCellEdit();
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") { e.preventDefault(); saveCellEdit(true); }
                                                                        if (e.key === "Escape") cancelCellEdit();
                                                                    }}
                                                                />
                                                            </div>
                                                        )
                                                    ) : isEditMode && col.editable && !isColLocked(col.key) ? (
                                                        // ── Full edit mode ──
                                                        col.editType === "images" ? (
                                                            <div className={styles.markdownCell}>
                                                                {isDirty
                                                                    ? col.render({ ...item, ...(editRow ?? {}) } as T)
                                                                    : col.render(item)}
                                                                <button
                                                                    className={`${styles.markdownCellBtn} ${imagePanelOpen && imagePanelRowId === id && imagePanelColKey === col.key ? styles.markdownCellBtnActive : ""}`}
                                                                    onClick={(e) => { e.stopPropagation(); openImagePanel(id, col.key); }}
                                                                    title="Open image editor"
                                                                >
                                                                    <BiImages />
                                                                </button>
                                                            </div>
                                                        ) : col.editType === "tags" ? (() => {
                                                            const tagsVal: string[] = editRow && col.key in editRow
                                                                ? (editRow[col.key] as string[])
                                                                : (col.getTagsValue ? col.getTagsValue(item) : []);
                                                            return (
                                                                <TagsEditor
                                                                    tags={tagsVal}
                                                                    onChange={(tags) => setEditCell(id, col.key, tags)}
                                                                    onNavigateDown={() => navigateEditCell(id, col.key, "down")}
                                                                />
                                                            );
                                                        })() : col.editType === "markdown" ? (
                                                            <div className={styles.markdownCell}>
                                                                {isDirty
                                                                    ? col.render({ ...item, ...(editRow ?? {}) } as T)
                                                                    : col.render(item)}
                                                                <button
                                                                    className={`${styles.markdownCellBtn} ${markdownPanelOpen && markdownPanelRowId === id && markdownPanelColKey === col.key ? styles.markdownCellBtnActive : ""}`}
                                                                    onClick={(e) => { e.stopPropagation(); openMarkdownPanel(id, col.key); }}
                                                                    title="Open markdown editor"
                                                                >
                                                                    <BiPencil />
                                                                </button>
                                                            </div>
                                                        ) : col.editType === "textarea" ? (
                                                            <textarea
                                                                className={styles.editInput}
                                                                data-editcell={`${String(id)}:${col.key}`}
                                                                value={editVal}
                                                                rows={2}
                                                                onChange={(e) => setEditCell(id, col.key, e.target.value)}
                                                                onFocus={() => setFocusedEditCell({ id, colKey: col.key })}
                                                                onBlur={() => setFocusedEditCell(null)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Tab") { e.preventDefault(); navigateEditCell(id, col.key, e.shiftKey ? "left" : "right"); }
                                                                }}
                                                            />
                                                        ) : col.editType === "select" ? (
                                                            <div className={styles.editSelectWrapper}>
                                                                {col.render({ ...item, ...(editRow ?? {}) } as T)}
                                                                <select
                                                                    className={styles.editSelectOverlay}
                                                                    data-editcell={`${String(id)}:${col.key}`}
                                                                    value={editVal}
                                                                    onChange={(e) => setEditCell(id, col.key, e.target.value)}
                                                                    onFocus={() => setFocusedEditCell({ id, colKey: col.key })}
                                                                    onBlur={() => setFocusedEditCell(null)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Tab") { e.preventDefault(); navigateEditCell(id, col.key, e.shiftKey ? "left" : "right"); }
                                                                        else if (e.key === "ArrowUp") { e.preventDefault(); navigateEditCell(id, col.key, "up"); }
                                                                        else if (e.key === "ArrowDown") { e.preventDefault(); navigateEditCell(id, col.key, "down"); }
                                                                    }}
                                                                >
                                                                    {col.editOptions?.map((opt) => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : col.editType === "date" ? (
                                                            <DatePicker
                                                                label={col.label}
                                                                showLabel={false}
                                                                allowPast
                                                                portal
                                                                selected={editVal ? new Date(String(editVal) + "T00:00:00") : undefined}
                                                                onSelect={(date) => {
                                                                    setEditCell(id, col.key, date ? dateFnsFormat(date, "yyyy-MM-dd") : "");
                                                                }}
                                                            />
                                                        ) : (
                                                            <input
                                                                className={styles.editInput}
                                                                data-editcell={`${String(id)}:${col.key}`}
                                                                type={col.editType === "number" ? "number" : col.editType === "datetime-local" ? "datetime-local" : "text"}
                                                                value={editVal}
                                                                onChange={(e) => setEditCell(
                                                                    id,
                                                                    col.key,
                                                                    col.editType === "number" ? Number(e.target.value) : e.target.value,
                                                                )}
                                                                onFocus={() => setFocusedEditCell({ id, colKey: col.key })}
                                                                onBlur={() => setFocusedEditCell(null)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "ArrowUp") { e.preventDefault(); navigateEditCell(id, col.key, "up"); }
                                                                    else if (e.key === "ArrowDown" || e.key === "Enter") { e.preventDefault(); navigateEditCell(id, col.key, "down"); }
                                                                    else if (e.key === "Tab") { e.preventDefault(); navigateEditCell(id, col.key, e.shiftKey ? "left" : "right"); }
                                                                    else if (e.key === "ArrowLeft") {
                                                                        const inp = e.target as HTMLInputElement;
                                                                        if (inp.selectionStart === 0 && inp.selectionEnd === 0) { e.preventDefault(); navigateEditCell(id, col.key, "left"); }
                                                                    }
                                                                    else if (e.key === "ArrowRight") {
                                                                        const inp = e.target as HTMLInputElement;
                                                                        if (inp.selectionStart === inp.value.length && inp.selectionEnd === inp.value.length) { e.preventDefault(); navigateEditCell(id, col.key, "right"); }
                                                                    }
                                                                }}
                                                            />
                                                        )
                                                    ) : (
                                                        isDirty
                                                            ? col.render({ ...item, ...(editRow ?? {}) } as T)
                                                            : col.render(item)
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                            {/* ── New row drafts ── */}
                            {onCreateRow && draftRows.map((draft) => (
                                <tr key={draft.id} className={styles.newDraftRow}>
                                    <td className={styles.stickyCol}>
                                        <div className={styles.draftRowActions}>
                                            <button
                                                className={styles.dotsBtn}
                                                title="Cancel new row"
                                                onClick={() => setDraftRows(prev => prev.filter(d => d.id !== draft.id))}
                                            >
                                                <BiX />
                                            </button>
                                            <button
                                                className={styles.dotsBtn}
                                                title="Copy row values"
                                                onClick={() => {
                                                    const clipboard: Record<string, string | string[]> = {};
                                                    for (const col of columns) {
                                                        if (!col.editable) continue;
                                                        if (permanentlyLockedCols?.includes(col.key)) continue;
                                                        if (draft.values[col.key] !== undefined) clipboard[col.key] = draft.values[col.key];
                                                    }
                                                    setRowClipboard(clipboard);
                                                }}
                                            >
                                                <BiCopy />
                                            </button>
                                            {rowClipboard && (
                                                <button
                                                    className={styles.dotsBtn}
                                                    title="Paste row values"
                                                    onClick={() => {
                                                        updateDraft(draft.id, d => ({
                                                            ...d,
                                                            values: {
                                                                ...d.values,
                                                                ...Object.fromEntries(
                                                                    Object.entries(rowClipboard).filter(([key]) => {
                                                                        const col = columns.find(c => c.key === key);
                                                                        return col?.editable && !permanentlyLockedCols?.includes(key);
                                                                    })
                                                                ),
                                                            },
                                                        }));
                                                    }}
                                                >
                                                    <BiClipboard />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    {activeCols.map((col) => (
                                        <td key={col.key} style={{ minWidth: col.minWidth, width: colWidths[col.key] }}
                                            onContextMenu={(e) => handleContextMenu(e, col.key, null, true, draft.id)}>
                                            {(col.editable && !isColLocked(col.key)) || col.newRowEditable || (col.editable && onCreateRow != null && permanentlyLockedCols?.includes(col.key)) ? (
                                                col.editType === "tags" ? (
                                                    <div className={styles.newRowAiWrap}>
                                                        <TagsEditor
                                                            tags={(draft.values[col.key] as string[]) ?? []}
                                                            onChange={(tags) => updateDraft(draft.id, d => ({ ...d, values: { ...d.values, [col.key]: tags } }))}
                                                        />
                                                        {col.aiGenerate && (
                                                            <span className={styles.newRowAiBtn}>
                                                                <button
                                                                    className={`${styles.markdownCellBtn} ${styles.markdownCellBtnActive}`}
                                                                    onClick={() => handleNewRowAiGenerate(col, draft.id)}
                                                                    disabled={draft.aiLoading[col.key] || !isDraftAiReady(draft)}
                                                                    title={!isDraftAiReady(draft) ? "Fill in required fields first" : "Fill with AI"}
                                                                ><PiSparkleFill className={draft.aiLoading[col.key] ? "animate-pulse" : ""} /></button>
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : col.editType === "markdown" ? (
                                                    <div className={styles.markdownCell}>
                                                        <span style={{ color: "var(--color-foreground-light)", fontSize: 11, opacity: 0.6 }}>
                                                            {(draft.values[col.key] as string)?.slice(0, 40) || "—"}
                                                        </span>
                                                        <button
                                                            className={`${styles.markdownCellBtn} ${markdownPanelOpen && markdownPanelRowId === "__new__" + draft.id && markdownPanelColKey === col.key ? styles.markdownCellBtnActive : ""}`}
                                                            onClick={(e) => { e.stopPropagation(); openMarkdownPanel("__new__" + draft.id, col.key); }}
                                                            title="Open editor"
                                                        ><BiPencil /></button>
                                                    </div>
                                                ) : col.editType === "images" ? (
                                                    <div className={styles.markdownCell}>
                                                        <span style={{ color: "var(--color-foreground-light)", fontSize: 11, opacity: 0.6 }}>
                                                            {((draft.values[col.key] as string[])?.length ?? 0)} image{((draft.values[col.key] as string[])?.length ?? 0) !== 1 ? "s" : ""}
                                                        </span>
                                                        <button
                                                            className={`${styles.markdownCellBtn} ${imagePanelOpen && imagePanelRowId === "__new__" + draft.id && imagePanelColKey === col.key ? styles.markdownCellBtnActive : ""}`}
                                                            onClick={(e) => { e.stopPropagation(); openImagePanel("__new__" + draft.id, col.key); }}
                                                            title="Open image editor"
                                                        ><BiImages /></button>
                                                    </div>
                                                ) : col.editType === "select" ? (
                                                    <div className={styles.newRowAiWrap}>
                                                        <select
                                                            className={styles.editInput}
                                                            value={(draft.values[col.key] as string) ?? ""}
                                                            onChange={(e) => updateDraft(draft.id, d => ({ ...d, values: { ...d.values, [col.key]: e.target.value } }))}
                                                        >
                                                            <option value="">—</option>
                                                            {col.editOptions?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                        {col.aiGenerate && (
                                                            <span className={styles.newRowAiBtn}>
                                                                <button
                                                                    className={`${styles.markdownCellBtn} ${styles.markdownCellBtnActive}`}
                                                                    onClick={() => handleNewRowAiGenerate(col, draft.id)}
                                                                    disabled={draft.aiLoading[col.key] || !isDraftAiReady(draft)}
                                                                    title={!isDraftAiReady(draft) ? "Fill in required fields first" : "Fill with AI"}
                                                                ><PiSparkleFill className={draft.aiLoading[col.key] ? "animate-pulse" : ""} /></button>
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : col.editType === "textarea" ? (
                                                    <div className={styles.newRowAiWrap}>
                                                        <textarea
                                                            className={styles.editInput}
                                                            rows={2}
                                                            placeholder={col.label}
                                                            value={(draft.values[col.key] as string) ?? ""}
                                                            onChange={(e) => updateDraft(draft.id, d => ({ ...d, values: { ...d.values, [col.key]: e.target.value } }))}
                                                        />
                                                        {col.aiGenerate && (
                                                            <span className={styles.newRowAiBtn}>
                                                                <button
                                                                    className={`${styles.markdownCellBtn} ${styles.markdownCellBtnActive}`}
                                                                    onClick={() => handleNewRowAiGenerate(col, draft.id)}
                                                                    disabled={draft.aiLoading[col.key] || !isDraftAiReady(draft)}
                                                                    title={!isDraftAiReady(draft) ? "Fill in required fields first" : "Fill with AI"}
                                                                ><PiSparkleFill className={draft.aiLoading[col.key] ? "animate-pulse" : ""} /></button>
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : col.editType === "date" ? (
                                                    <DatePicker
                                                        label={col.label}
                                                        showLabel={false}
                                                        allowPast
                                                        portal
                                                        placeholder={col.label}
                                                        selected={(draft.values[col.key] as string) ? new Date((draft.values[col.key] as string) + "T00:00:00") : undefined}
                                                        onSelect={(date) => updateDraft(draft.id, d => ({ ...d, values: { ...d.values, [col.key]: date ? dateFnsFormat(date, "yyyy-MM-dd") : "" } }))}
                                                    />
                                                ) : (
                                                    <div className={styles.newRowAiWrap}>
                                                        <input
                                                            className={styles.editInput}
                                                            type={col.editType === "number" ? "number" : col.editType === "datetime-local" ? "datetime-local" : "text"}
                                                            placeholder={col.label}
                                                            value={(draft.values[col.key] as string) ?? ""}
                                                            onChange={(e) => updateDraft(draft.id, d => ({ ...d, values: { ...d.values, [col.key]: e.target.value } }))}
                                                        />
                                                        {col.aiGenerate && (
                                                            <span className={styles.newRowAiBtn}>
                                                                <button
                                                                    className={`${styles.markdownCellBtn} ${styles.markdownCellBtnActive}`}
                                                                    onClick={() => handleNewRowAiGenerate(col, draft.id)}
                                                                    disabled={draft.aiLoading[col.key] || !isDraftAiReady(draft)}
                                                                    title={!isDraftAiReady(draft) ? "Fill in required fields first" : "Fill with AI"}
                                                                ><PiSparkleFill className={draft.aiLoading[col.key] ? "animate-pulse" : ""} /></button>
                                                            </span>
                                                        )}
                                                    </div>
                                                )
                                            ) : (
                                                <span style={{ color: "var(--color-foreground-light)", opacity: 0.3, fontSize: 13 }}>—</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {/* ── New row: extra fields for hidden-but-required columns ── */}
                            {onCreateRow && draftRows.map((draft) => {
                                const extraCols = columns.filter(
                                    (c) => c.editable && !activeCols.find((a) => a.key === c.key)
                                );
                                if (extraCols.length === 0) return null;
                                return (
                                    <tr key={`extra-${draft.id}`} className={styles.newDraftRowExtra}>
                                        <td colSpan={activeCols.length + 1}>
                                            <div className={styles.newRowExtraFields}>
                                                {extraCols.map((col) => (
                                                    <div key={col.key} className={styles.newRowExtraField}>
                                                        <label className={styles.newRowExtraLabel}>{col.label}</label>
                                                        {col.editType === "tags" ? (
                                                            <TagsEditor
                                                                tags={(draft.values[col.key] as string[]) ?? []}
                                                                onChange={(tags) => updateDraft(draft.id, d => ({ ...d, values: { ...d.values, [col.key]: tags } }))}
                                                            />
                                                        ) : col.editType === "select" ? (
                                                            <select
                                                                className={styles.editInput}
                                                                value={(draft.values[col.key] as string) ?? ""}
                                                                onChange={(e) => updateDraft(draft.id, d => ({ ...d, values: { ...d.values, [col.key]: e.target.value } }))}
                                                            >
                                                                <option value="">—</option>
                                                                {col.editOptions?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                        ) : col.editType === "textarea" ? (
                                                            <textarea
                                                                className={styles.editInput}
                                                                rows={2}
                                                                placeholder={col.label}
                                                                value={(draft.values[col.key] as string) ?? ""}
                                                                onChange={(e) => updateDraft(draft.id, d => ({ ...d, values: { ...d.values, [col.key]: e.target.value } }))}
                                                            />
                                                        ) : col.editType === "markdown" ? (
                                                            <div className={styles.markdownCell}>
                                                                <span style={{ color: "var(--color-foreground-light)", fontSize: 11, opacity: 0.6 }}>
                                                                    {(draft.values[col.key] as string)?.slice(0, 40) || "—"}
                                                                </span>
                                                                <button
                                                                    className={`${styles.markdownCellBtn} ${markdownPanelOpen && markdownPanelRowId === `__new__${draft.id}` && markdownPanelColKey === col.key ? styles.markdownCellBtnActive : ""}`}
                                                                    onClick={(e) => { e.stopPropagation(); openMarkdownPanel(`__new__${draft.id}`, col.key); }}
                                                                    title="Open editor"
                                                                ><BiPencil /></button>
                                                            </div>
                                                        ) : col.editType === "images" ? (
                                                            <div className={styles.markdownCell}>
                                                                <span style={{ color: "var(--color-foreground-light)", fontSize: 11, opacity: 0.6 }}>
                                                                    {((draft.values[col.key] as string[])?.length ?? 0)} image{((draft.values[col.key] as string[])?.length ?? 0) !== 1 ? "s" : ""}
                                                                </span>
                                                                <button
                                                                    className={`${styles.markdownCellBtn} ${imagePanelOpen && imagePanelRowId === `__new__${draft.id}` && imagePanelColKey === col.key ? styles.markdownCellBtnActive : ""}`}
                                                                    onClick={(e) => { e.stopPropagation(); openImagePanel(`__new__${draft.id}`, col.key); }}
                                                                    title="Open image editor"
                                                                ><BiImages /></button>
                                                            </div>
                                                        ) : col.editType === "date" ? (
                                                            <DatePicker
                                                                label={col.label}
                                                                showLabel={false}
                                                                allowPast
                                                                portal
                                                                placeholder={col.label}
                                                                selected={(draft.values[col.key] as string) ? new Date((draft.values[col.key] as string) + "T00:00:00") : undefined}
                                                                onSelect={(date) => updateDraft(draft.id, d => ({ ...d, values: { ...d.values, [col.key]: date ? dateFnsFormat(date, "yyyy-MM-dd") : "" } }))}
                                                            />
                                                        ) : (
                                                            <input
                                                                type={col.editType === "number" ? "number" : col.editType === "datetime-local" ? "datetime-local" : "text"}
                                                                className={styles.editInput}
                                                                placeholder={col.label}
                                                                value={(draft.values[col.key] as string) ?? ""}
                                                                onChange={(e) => updateDraft(draft.id, d => ({ ...d, values: { ...d.values, [col.key]: e.target.value } }))}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* ── Add row button ── */}
                            {onCreateRow && (
                                <tr>
                                    <td colSpan={activeCols.length + 1} className={styles.addRowCell}>
                                        <button className={styles.addRowBtn} onClick={() => {
                                            setVisibleCols(new Set(columns.map((c) => c.key)));
                                            setDraftRows(prev => [...prev, { id: String(Date.now() + Math.random()), values: {}, aiLoading: {}, fillAiLoading: false }]);
                                        }}>
                                            <BiPlus /> Add Row
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Browse filter side panel ─────────────────────────────── */}
            {filterOpen && filterableColumns && filterableColumns.length > 0 && onFiltersChange && (
                <BrowseFilterPanel
                    filterableColumns={filterableColumns}
                    activeFilters={activeFilters ?? []}
                    onFiltersChange={onFiltersChange}
                    width={filterPanelWidth}
                    onWidthChange={setFilterPanelWidth}
                    onClose={() => setFilterOpen(false)}
                />
            )}

            {/* ── Preview panel ─────────────────────────────────────────── */}
            {panelOpen && renderPreview && (
                <>
                    <div
                        className={styles.panelResizeHandle}
                        onMouseDown={handlePanelResizeStart}
                    />
                    <div
                        className={styles.previewPanel}
                        style={{ width: panelWidth, minWidth: panelWidth, maxWidth: panelWidth }}
                    >
                        <div className={styles.previewPanelHeader}>
                            <span className={styles.previewPanelTitle}>Preview</span>
                            <button
                                className={styles.btnIcon}
                                onClick={() => setPanelOpen(false)}
                                title="Close panel"
                            >
                                <BiX />
                            </button>
                        </div>
                        <div className={styles.previewPanelBody}>
                            {previewItem ? (
                                renderPreview(previewItem)
                            ) : (
                                <div className={styles.previewPanelEmpty}>
                                    Click a row to preview
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            {/* ── Markdown editor panel ─────────────────────────────────── */}
            {markdownPanelOpen && (
                <>
                    <div
                        className={styles.panelResizeHandle}
                        onMouseDown={handleMarkdownPanelResizeStart}
                    />
                    <div
                        className={styles.markdownPanel}
                        style={{ width: markdownPanelWidth, minWidth: markdownPanelWidth, maxWidth: markdownPanelWidth }}
                    >
                        <div className={styles.markdownPanelHeader}>
                            <span className={styles.previewPanelTitle}>
                                {markdownPanelCol?.label ?? "Edit"}
                            </span>
                            <div className={styles.markdownPanelTabs}>
                                <button
                                    className={`${styles.markdownTabBtn} ${markdownTab === "write" ? styles.markdownTabBtnActive : ""}`}
                                    onClick={() => setMarkdownTab("write")}
                                >
                                    Write
                                </button>
                                <button
                                    className={`${styles.markdownTabBtn} ${markdownTab === "preview" ? styles.markdownTabBtnActive : ""}`}
                                    onClick={() => setMarkdownTab("preview")}
                                >
                                    Preview
                                </button>
                            </div>
                            {markdownPanelCol?.aiGenerate && (
                                <button
                                    className={`${styles.markdownTabBtn} ${styles.markdownAiBtn}`}
                                    onClick={handleMarkdownAiGenerate}
                                    disabled={markdownAiLoading}
                                    title="Auto-fill with AI"
                                >
                                    {markdownAiLoading
                                        ? <BiRefresh className={styles.spinning} />
                                        : "✦ AI"
                                    }
                                </button>
                            )}
                            <button className={styles.btnIcon} onClick={closeMarkdownPanel} title="Close">
                                <BiX />
                            </button>
                        </div>
                        {markdownTab === "write" ? (
                            <textarea
                                className={styles.markdownTextarea}
                                value={markdownPanelValue}
                                onChange={(e) => {
                                    if (markdownPanelRowId !== null && markdownPanelColKey)
                                        setEditCell(markdownPanelRowId, markdownPanelColKey, e.target.value);
                                }}
                                placeholder="Write markdown here…"
                                spellCheck={false}
                                autoFocus
                            />
                        ) : (
                            <div className={styles.markdownPreview}>
                                {markdownPanelValue
                                    ? <ReactMarkdown>{markdownPanelValue}</ReactMarkdown>
                                    : <span className={styles.previewPanelEmpty}>Nothing to preview</span>
                                }
                            </div>
                        )}
                    </div>
                </>
            )}
            {/* ── Image editor panel ────────────────────────────────────── */}
            {imagePanelOpen && (
                <>
                    <div className={styles.panelResizeHandle} onMouseDown={handleImagePanelResizeStart} />
                    <div
                        className={styles.markdownPanel}
                        style={{ width: imagePanelWidth, minWidth: imagePanelWidth, maxWidth: imagePanelWidth }}
                    >
                        <div className={styles.markdownPanelHeader}>
                            <span className={styles.previewPanelTitle}>
                                {imagePanelCol?.label ?? "Images"}
                            </span>
                            <button className={styles.btnIcon} onClick={closeImagePanel} title="Close"><BiX /></button>
                        </div>
                        <div className={styles.imagePanelBody}>
                            {imagePanelValue.map((url, i) => (
                                <div key={i} className={styles.imagePanelRow}>
                                    <div className={styles.imagePanelThumb}>
                                        {url.trim() && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={url}
                                                alt=""
                                                className={styles.imagePanelThumbImg}
                                                onError={(e) => (e.currentTarget.style.display = "none")}
                                                onLoad={(e) => (e.currentTarget.style.display = "")}
                                            />
                                        )}
                                    </div>
                                    <input
                                        className={styles.imagePanelInput}
                                        value={url}
                                        placeholder="https://…"
                                        onChange={(e) => {
                                            const updated = [...imagePanelValue];
                                            updated[i] = e.target.value;
                                            setImagePanelImages(updated);
                                        }}
                                    />
                                    <button
                                        className={styles.imagePanelRemoveBtn}
                                        onClick={() => setImagePanelImages(imagePanelValue.filter((_, j) => j !== i))}
                                        title="Remove"
                                    >
                                        <BiX />
                                    </button>
                                </div>
                            ))}
                            <button
                                className={styles.imagePanelAddBtn}
                                onClick={() => setImagePanelImages([...imagePanelValue, ""])}
                            >
                                <BiPlus /> Add Image
                            </button>
                        </div>
                    </div>
                </>
            )}
            </div>{/* end bodyRow */}

            {/* ── Commit bar ────────────────────────────────────────────── */}
            {totalPending > 0 && (
                <div className={styles.commitBar}>
                    <span className={styles.commitBarInfo}>
                        {dirtyCount > 0 && `${dirtyCount} row${dirtyCount !== 1 ? "s" : ""} modified`}
                        {dirtyCount > 0 && draftRows.length > 0 && " · "}
                        {draftRows.length > 0 && `${draftRows.length} new row${draftRows.length !== 1 ? "s" : ""}`}
                    </span>
                    <div className={styles.commitBarActions}>
                        <button onClick={discardChanges} className={styles.commitBarDiscard}>
                            Discard
                        </button>
                        <button onClick={openCommitModal} className={styles.commitBarBtn}>
                            <BiCheck /> Commit changes
                        </button>
                    </div>
                </div>
            )}

            {/* ── Inline cell edit action buttons ──────────────────────── */}
            {editingCellPos && createPortal(
                <div style={{ position: "fixed", top: editingCellPos.top, left: editingCellPos.left, transform: "translateX(-100%) translateY(-100%) translateY(-4px)", zIndex: 1000, display: "flex", gap: 4 }}>
                    <button
                        className={styles.cellSaveBtn}
                        onMouseDown={(e) => { e.preventDefault(); saveCellEdit(); }}
                        title="Save"
                    >
                        <BiCheck />
                    </button>
                    <button
                        className={styles.cellCancelBtn}
                        onMouseDown={(e) => { e.preventDefault(); cancelCellEdit(); }}
                        title="Cancel"
                    >
                        <BiX />
                    </button>
                </div>,
                document.body
            )}

            {/* ── Right-click context menu ─────────────────────────────── */}
            {ctxMenu && createPortal(
                <div
                    ref={ctxRef}
                    className={styles.contextMenu}
                    style={{ top: ctxMenu.y, left: ctxMenu.x }}
                >
                    {/* Edit mode toggle — not shown for new-row right-click */}
                    {!ctxMenu.isNewRow && onSaveEdits && (
                        <>
                            <button
                                className={`${styles.ctxItem} ${isEditMode ? styles.ctxItemActive : ""}`}
                                onClick={() => { isEditMode ? exitEditMode() : enterEditMode(); closeCtx(); }}
                            >
                                <BiPencil /> {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
                            </button>
                            <div className={styles.ctxDivider} />
                        </>
                    )}
                    {/* Column section */}
                    <div className={styles.ctxSection}>Column</div>
                    <button className={styles.ctxItem} onClick={ctxToggleColWrap}>
                        <BiText />
                        {shouldWrap(ctxMenu.colKey) ? "No Wrap Column" : "Wrap Column"}
                    </button>
                    <button className={styles.ctxItem} onClick={ctxHideColumn}>
                        <BiHide /> Hide Column
                    </button>
                    {(() => {
                        const col = columns.find((c) => c.key === ctxMenu.colKey);
                        if (!col?.editable) return null;
                        const locked = isColLocked(col.key);
                        const permanent = isPermanentForRole(col.key);
                        return (
                            <button
                                className={`${styles.ctxItem} ${locked ? styles.ctxItemActive : ""}`}
                                onClick={() => { toggleColLock(col.key); closeCtx(); }}
                                disabled={permanent}
                                title={permanent ? "This column is always locked" : undefined}
                            >
                                <BiLock /> {locked ? "Unlock Column" : "Lock Column"}
                            </button>
                        );
                    })()}
                    {(() => {
                        const col = columns.find((c) => c.key === ctxMenu.colKey);
                        const sortKey = col?.sortKey ?? col?.key;
                        if (!col?.getValue || !onSortChange) return null;
                        return (
                            <>
                                <div className={styles.ctxDivider} />
                                <div className={styles.ctxSection}>Sort</div>
                                <button
                                    className={`${styles.ctxItem} ${sortBy === sortKey && sortDir === "asc" ? styles.ctxItemActive : ""}`}
                                    onClick={() => { onSortChange(sortKey!, "asc"); closeCtx(); }}
                                >
                                    <PiSortDescending /> Ascending
                                </button>
                                <button
                                    className={`${styles.ctxItem} ${sortBy === sortKey && sortDir === "desc" ? styles.ctxItemActive : ""}`}
                                    onClick={() => { onSortChange(sortKey!, "desc"); closeCtx(); }}
                                >
                                    <PiSortAscending /> Descending
                                </button>
                            </>
                        );
                    })()}

                    {/* Cell section */}
                    <div className={styles.ctxDivider} />
                    <div className={styles.ctxSection}>Cell</div>
                    {!ctxMenu.isNewRow && (
                        <button className={styles.ctxItem} onClick={ctxCopyCell}>
                            <BiCopy /> Copy Cell
                        </button>
                    )}
                    {ctxMenu.isNewRow ? (
                        // New row: only offer cell AI fill here
                        (() => {
                            const col = columns.find((c) => c.key === ctxMenu.colKey);
                            const hasCellAi = !!col?.aiGenerate;
                            const draft = ctxMenu.draftId ? draftRows.find(d => d.id === ctxMenu.draftId) : undefined;
                            const aiReady = draft ? isDraftAiReady(draft) : false;
                            return hasCellAi ? (
                                <button
                                    className={styles.ctxItem}
                                    onClick={ctxAiFillCell}
                                    disabled={ctxAiLoading || !aiReady}
                                    title={!aiReady ? "Fill in required fields first" : undefined}
                                >
                                    <PiSparkleFill /> {ctxAiLoading ? "Generating…" : "Fill with AI"}
                                </button>
                            ) : <span className={styles.ctxEmpty}>No actions</span>;
                        })()
                    ) : (
                        ctxMenu.rowItem && (() => {
                            const col = columns.find((c) => c.key === ctxMenu.colKey);
                            return col?.editable && !isColLocked(col.key) && onSaveEdits ? (
                                <>
                                    <button className={styles.ctxItem} onClick={ctxEditCell}>
                                        <BiPencil /> Edit Cell
                                    </button>
                                    {col.aiGenerate && col.editType !== "markdown" && col.editType !== "images" && (
                                        <button className={styles.ctxItem} onClick={ctxAiFillCell} disabled={ctxAiLoading}>
                                            <PiSparkleFill /> {ctxAiLoading ? "Generating…" : "Fill with AI"}
                                        </button>
                                    )}
                                </>
                            ) : null;
                        })()
                    )}

                    {/* Go to reference */}
                    {!ctxMenu.isNewRow && ctxMenu.rowItem && (() => {
                        const col = columns.find((c) => c.key === ctxMenu.colKey);
                        if (!col?.references || !onGoToReference) return null;
                        const { view, label, getSearchTerm } = col.references;
                        const term = getSearchTerm(ctxMenu.rowItem as T);
                        if (!term) return null;
                        return (
                            <button
                                className={styles.ctxItem}
                                onClick={() => { onGoToReference(view, term); closeCtx(); }}
                            >
                                <BiLinkExternal /> Go to {label}
                            </button>
                        );
                    })()}

                    {/* Row section for new row */}
                    {ctxMenu.isNewRow && ctxMenu.draftId && (
                        (() => {
                            const draft = draftRows.find(d => d.id === ctxMenu.draftId);
                            const aiReady = draft ? isDraftAiReady(draft) : false;
                            const hasAi = columns.some((c) => c.editable && c.aiGenerate && c.editType !== "images");
                            return (
                                <>
                                    <div className={styles.ctxDivider} />
                                    <div className={styles.ctxSection}>Row</div>
                                    {hasAi && (
                                        <button
                                            className={styles.ctxItem}
                                            onClick={() => { closeCtx(); if (ctxMenu.draftId) handleFillRowWithAi(ctxMenu.draftId); }}
                                            disabled={draft?.fillAiLoading || !aiReady}
                                            title={!aiReady ? "Fill in required fields first" : undefined}
                                        >
                                            <PiSparkleFill /> {draft?.fillAiLoading ? "Filling…" : "Fill Row with AI"}
                                        </button>
                                    )}
                                    <button className={styles.ctxItem} onClick={() => {
                                        if (!draft) return;
                                        const clipboard: Record<string, string | string[]> = {};
                                        for (const col of columns) {
                                            if (!col.editable) continue;
                                            if (permanentlyLockedCols?.includes(col.key)) continue;
                                            if (draft.values[col.key] !== undefined) clipboard[col.key] = draft.values[col.key];
                                        }
                                        setRowClipboard(clipboard);
                                        closeCtx();
                                    }}>
                                        <BiCopy /> Copy Row Values
                                    </button>
                                    {rowClipboard && (
                                        <button className={styles.ctxItem} onClick={() => {
                                            if (!ctxMenu.draftId) return;
                                            updateDraft(ctxMenu.draftId, d => ({
                                                ...d,
                                                values: {
                                                    ...d.values,
                                                    ...Object.fromEntries(
                                                        Object.entries(rowClipboard).filter(([key]) => {
                                                            const col = columns.find(c => c.key === key);
                                                            return col?.editable && !permanentlyLockedCols?.includes(key);
                                                        })
                                                    ),
                                                },
                                            }));
                                            closeCtx();
                                        }}>
                                            <BiClipboard /> Paste Row Values
                                        </button>
                                    )}
                                </>
                            );
                        })()
                    )}

                    {/* Row section (only if right-clicked on a data row, not new row) */}
                    {!ctxMenu.isNewRow && ctxMenu.rowItem && (
                        <>
                            <div className={styles.ctxDivider} />
                            <div className={styles.ctxSection}>Row</div>
                            {getRowLink && (() => {
                                const href = getRowLink(ctxMenu.rowItem as T);
                                return (
                                    <a
                                        className={styles.ctxItem}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={closeCtx}
                                    >
                                        <BiLinkExternal /> Go to Page
                                    </a>
                                );
                            })()}
                            {onEdit && (
                                <button className={styles.ctxItem} onClick={ctxEditRow}>
                                    <BiEdit /> Edit Row
                                </button>
                            )}
                            <button className={styles.ctxItem} onClick={() => {
                                const item = ctxMenu.rowItem as T;
                                const clipboard: Record<string, string | string[]> = {};
                                for (const col of columns) {
                                    if (!col.editable) continue;
                                    if (permanentlyLockedCols?.includes(col.key)) continue;
                                    if (col.editType === "images") {
                                        clipboard[col.key] = col.getImagesValue ? col.getImagesValue(item) : [];
                                    } else if (col.editType === "tags") {
                                        const v = col.getValue ? col.getValue(item) : undefined;
                                        clipboard[col.key] = Array.isArray(v) ? v : (col.getTagsValue ? col.getTagsValue(item) : []);
                                    } else {
                                        clipboard[col.key] = col.getValue ? String(col.getValue(item) ?? "") : "";
                                    }
                                }
                                setRowClipboard(clipboard);
                                closeCtx();
                            }}>
                                <BiCopy /> Copy Row Values
                            </button>
                            {isEditMode && rowClipboard && (
                                <button className={styles.ctxItem} onClick={() => {
                                    const id = getRowId(ctxMenu.rowItem as T);
                                    for (const [key, val] of Object.entries(rowClipboard)) {
                                        const col = columns.find(c => c.key === key);
                                        if (!col?.editable || isColLocked(col.key)) continue;
                                        setEditCell(id, key, val);
                                    }
                                    closeCtx();
                                }}>
                                    <BiClipboard /> Paste Row Values
                                </button>
                            )}
                            {onBulkDelete && (
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
                            {onDeleteOne && (
                                <button className={`${styles.ctxItem} ${styles.rowMenuDanger}`} onClick={ctxDeleteRow}>
                                    <BiTrash /> Delete Row
                                </button>
                            )}
                        </>
                    )}
                </div>,
                document.body
            )}

            {/* ── Sort menu ─────────────────────────────────────────────── */}
            {sortMenuCol && createPortal(
                <div
                    ref={sortMenuRef}
                    className={styles.contextMenu}
                    style={{ top: sortMenuPos.top, left: sortMenuPos.left }}
                >
                    <button
                        className={`${styles.ctxItem} ${sortBy === sortMenuCol && sortDir === "asc" ? styles.ctxItemActive : ""}`}
                        onClick={() => applySortDir("asc")}
                    >
                        <PiSortDescending /> Ascending
                    </button>
                    <button
                        className={`${styles.ctxItem} ${sortBy === sortMenuCol && sortDir === "desc" ? styles.ctxItemActive : ""}`}
                        onClick={() => applySortDir("desc")}
                    >
                        <PiSortAscending /> Descending
                    </button>
                </div>,
                document.body
            )}

            {/* ── Mobile header menu ───────────────────────────────────── */}
            {mobileMenuOpen && createPortal(
                <div
                    ref={mobileMenuRef}
                    className={styles.contextMenu}
                    style={{ top: mobileMenuPos.top, right: mobileMenuPos.right, left: "auto", minWidth: 200 }}
                >
                    {onSaveEdits && (
                        <>
                            <button className={`${styles.ctxItem} ${isEditMode ? styles.ctxItemActive : ""}`} onClick={() => { isEditMode ? exitEditMode() : enterEditMode(); setMobileMenuOpen(false); }}>
                                <BiPencil /> {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
                            </button>
                            <div className={styles.ctxDivider} />
                        </>
                    )}
                    <button className={styles.ctxItem} onClick={() => { handleExportCsv(); setMobileMenuOpen(false); }} disabled={data.length === 0}>
                        <BiTable /> Export CSV
                    </button>
                    <button className={styles.ctxItem} onClick={() => { handleExportJson(); setMobileMenuOpen(false); }} disabled={data.length === 0}>
                        <BiCode /> Export JSON
                    </button>
                    <button className={styles.ctxItem} onClick={() => { openSearch(mobileBtnRef.current ?? undefined); setMobileMenuOpen(false); }}>
                        <BiSearch /> Search
                    </button>
                    <button className={styles.ctxItem} onClick={() => { onRefresh(); setMobileMenuOpen(false); }} disabled={loading || refreshing}>
                        <BiRefresh className={refreshing ? styles.spinning : ""} /> Refresh
                    </button>
                    <button className={styles.ctxItem} onClick={() => { openColMenu(mobileBtnRef.current ?? undefined); setMobileMenuOpen(false); }}>
                        <BiMenu /> Columns
                    </button>
                    {renderPreview && (
                        <button className={`${styles.ctxItem} ${panelOpen ? styles.ctxItemActive : ""}`} onClick={() => { togglePanel(); setMobileMenuOpen(false); }}>
                            <BiColumns /> Preview
                        </button>
                    )}
                    <div className={styles.ctxDivider} />
                    <button className={`${styles.ctxItem} ${isFullscreen ? styles.ctxItemActive : ""}`} onClick={() => { toggleFullscreen(); setMobileMenuOpen(false); }}>
                        {isFullscreen ? <BiExitFullscreen /> : <BiFullscreen />} {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </button>
                </div>,
                document.body
            )}

            {/* ── Commit modal ─────────────────────────────────────────── */}
            {commitModalOpen && createPortal(
                <div
                    className={styles.commitOverlay}
                    onClick={(e) => { if (e.target === e.currentTarget && !isCommitting) closeCommitModal(); }}
                >
                    <div className={styles.commitModal}>
                        <div className={styles.commitModalHeader}>
                            <h3 className={styles.commitModalTitle}>Commit Changes</h3>
                            {!isCommitting && (
                                <button className={styles.btnIcon} onClick={closeCommitModal} title="Close">
                                    <BiX />
                                </button>
                            )}
                        </div>
                        <div className={styles.commitModalBody}>
                            {commitResults.map(result => (
                                <div key={String(result.id)} className={styles.commitItem}>
                                    <div className={styles.commitItemMeta}>
                                        <div className={styles.commitItemHeader}>
                                            <span className={styles.commitItemLabel}>{typeof result.id === "string" && result.id.startsWith("__new__") ? "New Row" : `#${result.id}`}</span>
                                            <div className={styles.commitItemStatus}>
                                                {result.status === "idle" && (
                                                    <span className={styles.commitStatusIdle}>–</span>
                                                )}
                                                {result.status === "saving" && (
                                                    <BiRefresh className={`${styles.spinning} ${styles.commitStatusSaving}`} />
                                                )}
                                                {result.status === "success" && (
                                                    <BiCheck className={styles.commitStatusSuccess} />
                                                )}
                                                {result.status === "error" && (
                                                    <span className={styles.commitStatusError} title={result.error}>
                                                        <BiX /> {result.error ?? "Error"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {result.changes.map(change => (
                                            <div key={change.key} className={styles.commitChangeRow}>
                                                <span className={styles.commitChangeLabel}>{change.label}</span>
                                                <span className={styles.commitChangeFrom}>{change.from}</span>
                                                <span className={styles.commitChangeArrow}>→</span>
                                                <span className={styles.commitChangeTo}>{change.to}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.commitModalFooter}>
                            {commitDone ? (
                                <button onClick={closeCommitModal} className={styles.commitModalBtn}>
                                    Done
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={closeCommitModal}
                                        className={styles.commitModalCancelBtn}
                                        disabled={isCommitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCommit}
                                        disabled={isCommitting}
                                        className={styles.commitModalBtn}
                                    >
                                        {isCommitting ? (
                                            <><BiRefresh className={styles.spinning} /> Committing&hellip;</>
                                        ) : (
                                            <><BiCheck /> Commit {commitResults.length} change{commitResults.length !== 1 ? "s" : ""}</>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Pagination ────────────────────────────────────────────── */}
            {totalPages > 0 && (
                <div className={styles.pagination}>
                    <div className={styles.pageInfo}>
                        <span style={{ whiteSpace: "nowrap" }}>
                            {startItem}&ndash;{endItem} of {totalItems}
                        </span>
                        <div ref={pageSizeDropRef} style={{ position: "relative" }}>
                            <button
                                className={styles.pageSizeBtn}
                                onClick={() => setPageSizeDropOpen((o) => !o)}
                            >
                                {isCustomPageSize ? `${pageSize} / page` : `${pageSize} / page`}
                                <BiChevronDown style={{ fontSize: "10pt" }} />
                            </button>
                            {pageSizeDropOpen && (
                                <div className={styles.pageSizeDrop}>
                                    {PAGE_SIZE_PRESETS.map((n) => (
                                        <button
                                            key={n}
                                            className={`${styles.ctxItem} ${pageSize === n && !showCustomInput ? styles.ctxItemActive : ""}`}
                                            onClick={() => { onPageSizeChange(n); setPageSizeDropOpen(false); setShowCustomInput(false); setCustomPageSize(""); }}
                                        >
                                            {n} / page
                                        </button>
                                    ))}
                                    <div className={styles.ctxDivider} />
                                    <button
                                        className={`${styles.ctxItem} ${showCustomInput ? styles.ctxItemActive : ""}`}
                                        onClick={() => {
                                            setCustomPageSize(String(pageSize));
                                            setShowCustomInput(true);
                                            setPageSizeDropOpen(false);
                                        }}
                                    >
                                        Custom…
                                    </button>
                                </div>
                            )}
                        </div>
                        {showCustomInput && (
                            <input
                                type="number"
                                className={styles.pageSizeInput}
                                value={customPageSize}
                                onChange={(e) => setCustomPageSize(e.target.value)}
                                onBlur={(e) => {
                                    const v = parseInt(e.target.value, 10);
                                    if (!isNaN(v) && v > 0) onPageSizeChange(v);
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                autoFocus
                            />
                        )}
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

            {/* ── Hidden file input for CSV import ─────────────────────── */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={handleImportFile}
            />

            {/* ── Import CSV modal ──────────────────────────────────────── */}
            {importModalOpen && createPortal(
                <div
                    className={styles.commitOverlay}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setImportModalOpen(false);
                            setImportError(null);
                            setImportPending(null);
                        }
                    }}
                >
                    <div className={styles.commitModal} style={{ maxWidth: 540 }}>
                        <div className={styles.commitModalHeader}>
                            <span className={styles.commitModalTitle}>
                                {importPending ? "Duplicate IDs Detected" : "Paste CSV"}
                            </span>
                            <button className={styles.commitModalClose} onClick={() => { setImportModalOpen(false); setImportError(null); setImportPending(null); }}>
                                <BiX />
                            </button>
                        </div>

                        {importPending ? (
                            /* ── Duplicate confirmation ── */
                            <>
                                <p style={{ fontSize: "8.5pt", color: "var(--color-foreground-light)", margin: "0 0 12px", lineHeight: 1.6 }}>
                                    The following {importPending.duplicates.length} row{importPending.duplicates.length !== 1 ? "s" : ""} have IDs that already exist in the table.
                                    Would you like to <strong>edit the existing rows</strong> with the imported values, or <strong>ignore the duplicates</strong> and only add new rows?
                                </p>
                                <div style={{
                                    background: "var(--color-primary-dark)",
                                    border: "1px solid var(--color-third)",
                                    borderRadius: 8,
                                    padding: "8px 12px",
                                    maxHeight: 200,
                                    overflowY: "auto",
                                    marginBottom: 16,
                                }}>
                                    {importPending.duplicates.map((dup) => (
                                        <div key={String(dup.id)} style={{ fontSize: "8.5pt", fontFamily: "monospace", color: "var(--color-foreground)", padding: "2px 0" }}>
                                            {String(dup.id)}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                    <button className={styles.commitBarDiscard} onClick={() => { setImportModalOpen(false); setImportPending(null); setImportError(null); }}>
                                        Cancel
                                    </button>
                                    <button className={styles.commitBarDiscard} onClick={() => { commitImportResult(importPending.newDrafts, []); setImportPending(null); }}>
                                        Ignore Duplicates
                                    </button>
                                    <button className={styles.commitBarBtn} onClick={() => { commitImportResult(importPending.newDrafts, importPending.duplicates); setImportPending(null); }}>
                                        <BiCheck /> Edit Existing Rows
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* ── Paste CSV form ── */
                            <>
                                <p style={{ fontSize: "8.5pt", color: "var(--color-foreground-light)", margin: "0 0 10px" }}>
                                    Paste CSV text below. The first row must be a header row matching the column labels (same format as the CSV export).
                                </p>
                                <textarea
                                    className={styles.editInput}
                                    style={{ width: "100%", minHeight: 180, fontFamily: "monospace", fontSize: "8pt", resize: "vertical", boxSizing: "border-box" }}
                                    placeholder={"Column A,Column B,Column C\nvalue1,value2,value3"}
                                    value={importText}
                                    onChange={(e) => { setImportText(e.target.value); setImportError(null); }}
                                    autoFocus
                                />
                                {importError && (
                                    <p style={{ fontSize: "8.5pt", color: "var(--color-danger, #e55)", margin: "6px 0 0" }}>{importError}</p>
                                )}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                                    <button className={styles.commitBarDiscard} onClick={() => { setImportModalOpen(false); setImportError(null); }}>
                                        Cancel
                                    </button>
                                    <button className={styles.commitBarBtn} onClick={() => applyImportCsv(importText)}>
                                        <BiCheck /> Import
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
