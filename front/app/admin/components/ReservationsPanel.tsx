"use client";

import { useEffect, useState } from "react";
import { getAllReservations } from "@/app/lib/ReservationApi";
import { Reservation } from "@/app/types/ReservationTypes";
import Image from "next/image";
import { BiCar, BiRefresh, BiSearch, BiChevronDown, BiChevronUp } from "react-icons/bi";

const fmt = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const fmtTimestamp = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });

const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-block px-[8px] py-[2px] rounded-full bg-third/40 text-foreground text-[8pt] font-[500]">
        {children}
    </span>
);

const SKIP_CAR = new Set(["vin", "make", "model", "modelYear", "images", "description"]);

const ExpandedRow = ({ res }: { res: Reservation }) => {
    const carDetails = Object.entries(res.car).filter(([k]) => !SKIP_CAR.has(k));
    return (
        <div className="px-[20px] py-[20px] bg-primary-dark/40 border-t border-third/40 grid grid-cols-1 md:grid-cols-3 gap-[20px]">
            {/* Reservation details */}
            <div className="flex flex-col gap-[12px]">
                <p className="text-[8pt] font-[600] uppercase tracking-wider text-foreground-light">Reservation</p>
                <div className="grid grid-cols-2 gap-x-[16px] gap-y-[10px]">
                    {[
                        ["ID",         String(res.reservationId)],
                        ["Booked",     fmtTimestamp(res.dateBooked)],
                        ["Pick-up",    fmtTimestamp(res.pickUpTime)],
                        ["Drop-off",   fmtTimestamp(res.dropOffTime)],
                        ["Duration",   `${res.durationDays}d ${res.durationHours}h`],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <p className="text-[7.5pt] font-[600] uppercase tracking-wider text-foreground-light">{label}</p>
                            <p className="text-[10pt] text-foreground mt-[2px]">{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Car specs */}
            <div className="flex flex-col gap-[12px]">
                <p className="text-[8pt] font-[600] uppercase tracking-wider text-foreground-light">Vehicle Specs</p>
                <div className="grid grid-cols-2 gap-x-[16px] gap-y-[10px]">
                    {carDetails.map(([key, val]) => (
                        <div key={key}>
                            <p className="text-[7.5pt] font-[600] uppercase tracking-wider text-foreground-light">{fmt(key)}</p>
                            <p className="text-[10pt] text-foreground mt-[2px]">
                                {Array.isArray(val) ? (val.length ? val.join(", ") : "—") : String(val ?? "—")}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Car images */}
            <div className="flex flex-col gap-[8px]">
                <p className="text-[8pt] font-[600] uppercase tracking-wider text-foreground-light">Gallery</p>
                {res.car.images?.length ? (
                    <div className="flex gap-[8px] overflow-x-auto pb-[4px] scrollbar-hide">
                        {res.car.images.map((url, i) => (
                            <div key={i} className="relative flex-shrink-0 w-[110px] h-[74px] rounded-xl overflow-hidden border border-third bg-third/20">
                                <Image src={url} alt="" fill className="object-cover" sizes="110px"
                                    onError={(e) => (e.currentTarget.style.display = "none")} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-foreground-light text-[10pt]">No images.</p>
                )}
            </div>
        </div>
    );
};

const ReservationsPanel = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [query, setQuery] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const res = await getAllReservations({ pageSize: 100 });
            setReservations(res.data);
            setHasFetched(true);
        } catch (e) {
            alert("Fetch failed: " + e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReservations(); }, []);

    const filtered = reservations.filter((r) =>
        `${r.car.make} ${r.car.model} ${r.car.vin} ${r.reservationId}`
            .toLowerCase()
            .includes(query.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-[20px] pb-[40px]">
            {/* Header */}
            <div className="flex items-center justify-between gap-[12px] flex-wrap">
                <div>
                    <h2 className="text-foreground text-[16pt] font-[700]">Reservations</h2>
                    {hasFetched && (
                        <p className="text-foreground-light text-[10pt]">{filtered.length} of {reservations.length} reservations</p>
                    )}
                </div>
                <button
                    onClick={fetchReservations}
                    disabled={loading}
                    className="flex items-center gap-[6px] px-[14px] py-[8px] rounded-xl border border-third hover:border-accent/40 hover:bg-accent/5 text-foreground text-[10pt] transition-colors cursor-pointer disabled:opacity-50"
                >
                    <BiRefresh className={`text-[14pt] ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <BiSearch className="absolute left-[14px] top-1/2 -translate-y-1/2 text-foreground-light text-[13pt]" />
                <input
                    className="w-full bg-primary border border-third rounded-xl pl-[40px] pr-[14px] py-[10px] text-[10.5pt] text-foreground placeholder:text-foreground-light/60 focus:outline-none focus:border-accent/60 transition"
                    placeholder="Search by make, model, VIN or reservation ID…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* Table */}
            {!hasFetched && loading ? (
                <div className="flex flex-col gap-[8px]">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-[64px] rounded-xl bg-third/20 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-[60px] text-foreground-light gap-[8px]">
                    <BiCar className="text-[36pt] opacity-30" />
                    <p className="text-[11pt]">{hasFetched ? "No reservations match your search." : "No data loaded."}</p>
                </div>
            ) : (
                <div className="bg-primary border border-third/60 rounded-2xl overflow-hidden">
                    {/* Header row */}
                    <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-[16px] px-[20px] py-[12px] border-b border-third/50 bg-primary-dark/30">
                        {["Vehicle", "Reservation ID", "Pick-up", "Drop-off", ""].map((h) => (
                            <p key={h} className="text-[8pt] font-[600] uppercase tracking-wider text-foreground-light">{h}</p>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-third/40">
                        {filtered.map((res) => {
                            const isExpanded = expandedId === res.reservationId;
                            return (
                                <div key={res.reservationId}>
                                    <div
                                        className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-[16px] px-[20px] py-[14px] items-center hover:bg-primary-dark/20 transition-colors cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : res.reservationId)}
                                    >
                                        {/* Vehicle */}
                                        <div className="flex items-center gap-[12px] min-w-0">
                                            <div className="relative flex-shrink-0 w-[52px] h-[36px] rounded-lg overflow-hidden bg-third/30 border border-third/40">
                                                {res.car.images?.[0] ? (
                                                    <Image src={res.car.images[0]} alt="" fill className="object-cover" sizes="52px"
                                                        onError={(e) => (e.currentTarget.style.display = "none")} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-foreground-light/40">
                                                        <BiCar className="text-[16pt]" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-foreground text-[10.5pt] font-[600] truncate">{res.car.make} {res.car.model}</p>
                                                <p className="text-foreground-light text-[9pt]">{res.car.modelYear}</p>
                                            </div>
                                        </div>

                                        {/* ID */}
                                        <div className="hidden md:block">
                                            <Badge>#{res.reservationId}</Badge>
                                        </div>

                                        {/* Pick-up */}
                                        <p className="hidden md:block text-foreground text-[10pt]">{fmtTimestamp(res.pickUpTime)}</p>

                                        {/* Drop-off */}
                                        <p className="hidden md:block text-foreground text-[10pt]">{fmtTimestamp(res.dropOffTime)}</p>

                                        {/* Chevron */}
                                        <span className="text-foreground-light/40 text-[12pt]">
                                            {isExpanded ? <BiChevronUp /> : <BiChevronDown />}
                                        </span>
                                    </div>

                                    {isExpanded && <ExpandedRow res={res} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPanel;
