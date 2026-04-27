// ── Download helpers ──────────────────────────────────────────────────────────

export function downloadData(content: string, mimeType: string, filename: string) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function safeFilename(title: string, suffix: string): string {
    return `${title.replace(/\s+/g, "_").toLowerCase()}_${suffix}`;
}

// ── SVG export ────────────────────────────────────────────────────────────────

/** Replace CSS custom properties in a serialized SVG string with their computed values. */
function resolveCssVars(svgString: string): string {
    const style = getComputedStyle(document.documentElement);
    const vars = [
        "--color-primary", "--color-primary-dark", "--color-secondary",
        "--color-third", "--color-foreground", "--color-foreground-light",
        "--color-accent", "--color-background",
    ];
    let s = svgString;
    for (const v of vars) {
        const val = style.getPropertyValue(v).trim();
        if (val) s = s.replaceAll(`var(${v})`, val);
    }
    // Also resolve color-mix() if any remain (browsers may already compute them)
    return s;
}

export function exportSvg(svgEl: SVGSVGElement, filename: string) {
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    const w = svgEl.width.baseVal.value  || svgEl.getBoundingClientRect().width;
    const h = svgEl.height.baseVal.value || svgEl.getBoundingClientRect().height;
    if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const raw      = new XMLSerializer().serializeToString(clone);
    const resolved = resolveCssVars(raw);
    downloadData(resolved, "image/svg+xml;charset=utf-8", filename);
}

export async function exportSvgAsPng(svgEl: SVGSVGElement, filename: string, scale = 2) {
    // Use the SVG's own width/height attributes (set explicitly by ResizeObserver)
    const origW = svgEl.width.baseVal.value  || svgEl.getBoundingClientRect().width;
    const origH = svgEl.height.baseVal.value || svgEl.getBoundingClientRect().height;
    const w     = Math.round(origW * scale);
    const h     = Math.round(origH * scale);

    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    // viewBox is required so the SVG renderer scales the content to the new dimensions
    clone.setAttribute("viewBox", `0 0 ${origW} ${origH}`);
    clone.setAttribute("width",   String(w));
    clone.setAttribute("height",  String(h));

    const raw      = new XMLSerializer().serializeToString(clone);
    const resolved = resolveCssVars(raw);

    const bg  = getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim() || "#1a1a1a";
    const blob = new Blob([resolved], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);

    const img = new Image();
    img.src   = url;
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });

    const canvas    = document.createElement("canvas");
    canvas.width    = w;
    canvas.height   = h;
    const ctx       = canvas.getContext("2d")!;
    ctx.fillStyle   = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);

    const pngUrl = canvas.toDataURL("image/png");
    const a      = document.createElement("a");
    a.href       = pngUrl;
    a.download   = filename;
    a.click();
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

export function escapeCell(v: unknown): string {
    const s = typeof v === "object" && v !== null ? JSON.stringify(v) : String(v ?? "");
    return `"${s.replace(/"/g, '""')}"`;
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
    const head = headers.map(escapeCell).join(",");
    const body = rows.map(r => r.map(escapeCell).join(",")).join("\n");
    return head + "\n" + body;
}
