"use client";

import React, { useRef, useEffect } from "react";
import { BiTab, BiX } from "react-icons/bi";
import styles from "./spreadsheetTable.module.css";

export interface PanelTab {
	key: string;
	label: string;
	icon?: React.ReactNode;
	content: React.ReactNode;
	badge?: number;
	noPadding?: boolean;
	titleActions?: React.ReactNode;
	dividerBefore?: boolean;
}

interface Props {
	tabs: PanelTab[];
	activeTab: string;
	onTabChange: (key: string) => void;
	width: number;
	onWidthChange: (w: number) => void;
	onClose: () => void;
}

export default function OptionsSidePanel({
	tabs,
	activeTab,
	onTabChange,
	width,
	onWidthChange,
	onClose,
}: Props) {
	const resizeStartX = useRef<number | null>(null);
	const resizeStartW = useRef(width);

	useEffect(() => {
		const onMove = (e: MouseEvent) => {
			if (resizeStartX.current === null) return;
			const dx = resizeStartX.current - e.clientX;
			onWidthChange(Math.max(220, Math.min(560, resizeStartW.current + dx)));
		};
		const onUp = () => {
			resizeStartX.current = null;
		};
		document.addEventListener("mousemove", onMove);
		document.addEventListener("mouseup", onUp);
		return () => {
			document.removeEventListener("mousemove", onMove);
			document.removeEventListener("mouseup", onUp);
		};
	}, [onWidthChange]);

	return (
		<>
			<div
				className={styles.panelResizeHandle}
				onMouseDown={(e) => {
					resizeStartX.current = e.clientX;
					resizeStartW.current = width;
					e.preventDefault();
				}}
			/>
			<div
				className={styles.filterSidePanel}
				style={{
					width,
					minWidth: width,
					maxWidth: width,
					display: "flex",
					flexDirection: "column",
				}}
			>
				{/* ── Tab bar ───────────────────────────────────────────────── */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						background: "var(--color-primary-dark)",
                        border: "solid 1px color-mix(var(--color-accent) 50%, transparent 50%)",
                        borderRadius: "12px",
                        margin: "5px 5px 0 5px",
						padding: "4px",
						flexShrink: 0,
						gap: "5px",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "5px", flex: 1, minWidth: 0, overflow: "hidden" }}>
						{tabs.map((tab) => {
							const active = tab.key === activeTab;
							return (
								<React.Fragment key={tab.key}>
									{tab.dividerBefore && (
										<div style={{
											width: 1,
											alignSelf: "stretch",
											margin: "3px 0",
											background: "var(--color-third)",
											flexShrink: 0,
										}} />
									)}
									<button
										onClick={() => onTabChange(tab.key)}
										title={tab.label}
										style={{
											position: "relative",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											padding: "6px",
											borderRadius: "8px",
											border: "none",
											background: `${active ? "var(--color-accent)" : "transparent"}`,
											color: active
												? "var(--color-primary)"
												: "var(--color-foreground-light)",
											fontSize: "18px",
											cursor: "pointer",
											transition: "color 120ms, border-color 120ms",
											flexShrink: 0,
										}}
									>
										{tab.icon ?? tab.label}
										{!!tab.badge && (
											<span
												style={{
													position: "absolute",
													top: 4,
													right: 2,
													background: "var(--color-accent)",
													color: "white",
													borderRadius: 9999,
													fontSize: "6pt",
													fontWeight: 700,
													padding: "1px 4px",
													lineHeight: 1.4,
													pointerEvents: "none",
												}}
											>
												{tab.badge}
											</span>
										)}
									</button>
								</React.Fragment>
							);
						})}
					</div>
					<button
						className={styles.btnIcon}
						onClick={onClose}
						title="Close"
						style={{ flexShrink: 0 }}
					>
						<BiX />
					</button>
				</div>

				{/* ── Tab content (all mounted, active shown via display) ─── */}
				<div
					style={{
						flex: 1,
						minHeight: 0,
						overflowY: "auto",
						overflowX: "hidden",
					}}
				>
					{tabs.map((tab) => (
						<div
							key={tab.key}
							style={{
								display: tab.key === activeTab ? "flex" : "none",
								flexDirection: "column",
								padding: tab.noPadding ? "0" : "16px 14px",
								gap: 4,
								minHeight: "100%",
								boxSizing: "border-box",
							}}
						>
							{/* ── Tab title ── */}
							<div style={{
								padding: tab.noPadding ? "14px 14px 12px" : "0 0 12px",
								borderBottom: "1px solid var(--color-third)",
								marginBottom: 8,
								flexShrink: 0,
								display: "flex",
								alignItems: "center",
								gap: 6,
							}}>
								<p style={{
									margin: 0,
									fontSize: "14pt",
									fontWeight: 700,
									color: "var(--color-foreground)",
									letterSpacing: "-0.01em",
									flex: 1,
								}}>
									{tab.label}
								</p>
								{tab.titleActions && (
									<div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
										{tab.titleActions}
									</div>
								)}
							</div>
							{tab.content}
						</div>
					))}
				</div>
			</div>
		</>
	);
}
