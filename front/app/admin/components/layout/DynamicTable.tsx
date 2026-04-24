"use client";

import React, { useState } from "react";
import { Car } from "../../../types/CarTypes";
import Image from "next/image";
import styles from "./dynamicTable.module.css";

interface DynamicTableProps<T extends Car> {
	data: T[];
	title?: string;
	onDelete?: (id: string) => void;
}

export default function DynamicTable<T extends Car>({
	data,
	title,
	onDelete,
}: DynamicTableProps<T>) {
	const [expandedRow, setExpandedRow] = useState<string | null>(null);

	const toggleRow = (vin: string) => {
		setExpandedRow(expandedRow === vin ? null : vin);
	};

	const summaryColumns = [
		"vin",
		"make",
		"model",
		"modelYear",
		"pricePerDay",
		"vehicleClass",
	];

	if (!data || data.length === 0) {
		return (
			<div className={styles.emptyState}>
				No data available in {title || "this table"}.
			</div>
		);
	}

	return (
		<div className={styles.container}>
			{title && <h2 className={styles.tableTitle}>{title}</h2>}

			<div className={styles.tableWrapper}>
				<table className={styles.tableElement}>
					<thead className={styles.thead}>
						<tr>
							<th className={styles.indicatorCell}></th>
							{summaryColumns.map((col) => (
								<th key={col} className={styles.headerCell}>
									{col.replace(/([A-Z])/g, " $1")}
								</th>
							))}
							{onDelete && (
								<th className={`${styles.headerCell} ${styles.actionHeader}`}>
									Actions
								</th>
							)}
						</tr>
					</thead>
					<tbody className={styles.tbody}>
						{data.map((row) => {
							const isExpanded = expandedRow === String(row.vin);
							return (
								<React.Fragment key={row.vin}>
									<tr
										className={styles.rowSummary}
										onClick={() => toggleRow(row.vin)}
									>
										<td className={styles.indicatorCell}>
											{isExpanded ? "▼" : "▶"}
										</td>
										{summaryColumns.map((col) => (
											<td key={col} className={styles.dataCell}>
												{String(row[col as keyof T] ?? "—")}
											</td>
										))}
										{onDelete && (
											<td
												className={styles.actionCell}
												onClick={(e) => e.stopPropagation()}
											>
												<button
													onClick={() => onDelete(row.vin)}
													className={styles.deleteBtn}
												>
													Delete
												</button>
											</td>
										)}
									</tr>
									{isExpanded && (
										<tr className={styles.expandedRow}>
											<td
												colSpan={summaryColumns.length + 2}
												className={styles.expandedContainer}
											>
												<div className={styles.expandedContent}>
													{/* Detail Grid */}
													<div className={styles.detailsGrid}>
														{Object.entries(row).map(([key, val]) => (
															<div key={key}>
																<p className={styles.label}>
																	{key.replace(/([A-Z])/g, " $1")}
																</p>
																<p className={styles.value}>
																	{Array.isArray(val)
																		? val.join(", ")
																		: String(val ?? "—")}
																</p>
															</div>
														))}
													</div>

													{/* Gallery Preview */}
													<div className={styles.gallerySection}>
														<p className={styles.label}>Gallery Preview</p>
														<div className={styles.galleryWrapper}>
															{row.images?.map((img, i) => (
																<div key={i} style={{ flexShrink: 0 }}>
																	<Image
																		src={img}
																		width={112}
																		height={80}
																		className={styles.galleryImage}
																		alt="Vehicle Preview"
																		onError={(e) =>
																			(e.currentTarget.style.display = "none")
																		}
																	/>
																</div>
															))}
															{(!row.images || row.images.length === 0) && (
																<p
																	className={styles.value}
																	style={{ fontSize: "9pt", opacity: 0.6 }}
																>
																	No images available.
																</p>
															)}
														</div>
													</div>
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
