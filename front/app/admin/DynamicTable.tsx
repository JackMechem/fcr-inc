"use client";

import React, { useState } from "react";
import { Car } from "../types/CarTypes";
import Image from "next/image";

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

	// Columns to show in the "collapsed" summary view
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
			<div className="p-8 text-center border-2 border-dashed rounded-xl text-slate-400">
				No data available in {title || "this table"}.
			</div>
		);
	}

	return (
		<div className="flex flex-col space-y-4">
			{title && <h2 className="text-xl font-bold text-slate-800">{title}</h2>}
			<div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
				<table className="w-full text-left border-collapse">
					<thead className="bg-slate-50 border-b border-slate-200">
						<tr>
							<th className="p-4 w-10"></th>
							{summaryColumns.map((col) => (
								<th
									key={col}
									className="p-4 text-xs font-bold uppercase text-slate-500 tracking-wider"
								>
									{col.replace(/([A-Z])/g, " $1")}
								</th>
							))}
							{onDelete && (
								<th className="p-4 text-xs font-bold uppercase text-rose-500 text-center">
									Actions
								</th>
							)}
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{data.map((row) => {
							const isExpanded = expandedRow === String(row.vin);
							return (
								<React.Fragment key={row.vin}>
									<tr
										className="hover:bg-slate-50 transition-colors cursor-pointer group"
										onClick={() => toggleRow(row.vin)}
									>
										<td className="p-4 text-center text-slate-400 text-xs">
											{isExpanded ? "▼" : "▶"}
										</td>
										{summaryColumns.map((col) => (
											<td
												key={col}
												className="p-4 text-sm text-slate-600 font-medium"
											>
												{String(row[col])}
											</td>
										))}
										{onDelete && (
											<td
												className="p-4 text-center"
												onClick={(e) => e.stopPropagation()}
											>
												<button
													onClick={() => onDelete(row.vin)}
													className="px-3 py-1 bg-rose-50 text-rose-600 rounded-md text-xs font-bold hover:bg-rose-600 hover:text-white transition-all"
												>
													Delete
												</button>
											</td>
										)}
									</tr>
									{isExpanded && (
										<tr className="bg-slate-50/50">
											<td
												colSpan={summaryColumns.length + 2}
												className="p-0 border-t border-slate-200"
											>
												<div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-1">
													{/* Full Data Display */}
													<div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
														{Object.entries(row).map(([key, val]) => (
															<div key={key} className="space-y-1">
																<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
																	{key.replace(/([A-Z])/g, " $1")}
																</p>
																<p className="text-sm text-slate-700 break-words">
																	{Array.isArray(val)
																		? val.join(", ")
																		: String(val)}
																</p>
															</div>
														))}
													</div>
													{/* Image Preview */}
													<div className="space-y-2">
														<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
															Gallery Preview
														</p>
														<div className="flex gap-2 overflow-x-auto pb-2">
															{row.images?.map((img, i) => (
																<Image
																	key={i}
																	src={img}
                                                                    width={100}
                                                                    height={100}
																	className="h-20 w-28 object-cover rounded border bg-white"
																	alt="Car"
																	onError={(e) =>
																		(e.currentTarget.style.display = "none")
																	}
																/>
															))}
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
