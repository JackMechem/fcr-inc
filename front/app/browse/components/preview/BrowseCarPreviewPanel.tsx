"use client";

import { useEffect, useState, useRef } from "react";
import { useBrowsePreviewStore } from "@/stores/browsePreviewStore";
import { getCarAndReviews } from "@/app/car/[slug]/actions";
import { Car } from "@/app/types/CarTypes";
import { Review } from "@/app/types/ReviewTypes";
import Link from "next/link";
import Image from "next/image";
import Markdown from "react-markdown";
import RightColumn from "@/app/car/[slug]/components/layout/rightColumn";
import ReviewsSection from "@/app/car/[slug]/components/layout/ReviewsSection";
import Spec from "@/app/car/[slug]/components/specs/Spec";
import SpecGroup from "@/app/car/[slug]/components/specs/SpecGroup";
import { formatEnum } from "@/app/lib/formatEnum";
import { BiCar } from "react-icons/bi";
import { GiCarSeat } from "react-icons/gi";
import { PiEngine, PiLightning, PiGauge } from "react-icons/pi";
import { BsFuelPump } from "react-icons/bs";
import { TbArrowAutofitDown, TbManualGearbox, TbWheel } from "react-icons/tb";
import { MdRoofing } from "react-icons/md";
import carStyles from "@/app/car/[slug]/components/carDetail.module.css";
import styles from "./browsePreview.module.css";

const BrowseCarPreviewPanel = ({ width }: { width?: string }) => {
    const { previewOpen, selectedVin } = useBrowsePreviewStore();
    const [car, setCar] = useState<Car | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const lastVin = useRef<string | null>(null);

    useEffect(() => {
        if (!selectedVin || selectedVin === lastVin.current) return;
        lastVin.current = selectedVin;
        setLoading(true);
        setCar(null);
        setReviews([]);
        getCarAndReviews(selectedVin).then(({ car, reviews }) => {
            setCar(car);
            setReviews(reviews ?? []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [selectedVin]);

    if (!previewOpen) return null;

    const engineLabel = car
        ? (car.engineLayout === "DUAL_MOTOR" || car.engineLayout === "SINGLE_MOTOR"
            ? formatEnum(car.engineLayout)
            : `${formatEnum(car.engineLayout)}-${car.cylinders}`)
        : "";

    return (
        <div className={styles.panel} style={width ? { width } : undefined}>
            {/* ── Body ── */}
            <div className={styles.panelBody}>
                {loading && (
                    <div className={styles.emptyState}>Loading…</div>
                )}

                {!loading && !car && (
                    <div className={styles.emptyState}>Click a car to preview it here.</div>
                )}

                {!loading && car && (
                    <div className={styles.panelContent}>
                        {/* Image */}
                        {car.images[0] && (
                            <div className={styles.imageWrapper}>
                                <Image
                                    src={car.images[0]}
                                    alt={`${car.make} ${car.model}`}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    sizes="45vw"
                                />
                            </div>
                        )}

                        <div className={styles.innerContent}>
                            {/* Title + full-page link */}
                            <div>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                                    <h1 className={carStyles.carTitle}>{car.modelYear} {car.make} {car.model}</h1>
                                    <Link href={`/car/${car.vin}`} className={styles.fullPageLink} style={{ flexShrink: 0, marginTop: 4 }}>
                                        Full page
                                    </Link>
                                </div>
                                <p className={carStyles.carSubtitle}>{formatEnum(car.vehicleClass)} · {formatEnum(car.bodyType)}</p>
                            </div>

                            {/* Feature pills */}
                            {car.features?.length > 0 && (
                                <div className={carStyles.featurePills}>
                                    {car.features.map((f, i) => (
                                        <span key={f + i} className={carStyles.featurePill}>{f}</span>
                                    ))}
                                </div>
                            )}

                            {/* Booking */}
                            <RightColumn carData={car} />

                            {/* Specs */}
                            <div className={`card ${carStyles.specsCard}`}>
                                <p className={carStyles.specsCardTitle}>Specifications</p>
                                <div className={carStyles.specsGrid}>
                                    <SpecGroup title="Performance">
                                        <Spec icon={<PiLightning />} label="Horsepower" value={`${car.horsepower} hp`} />
                                        <Spec icon={<TbWheel />} label="Torque" value={`${car.torque} lb-ft`} />
                                        <Spec icon={<PiGauge />} label="MPG" value={`${car.mpg} mpg`} />
                                    </SpecGroup>
                                    <SpecGroup title="Drivetrain">
                                        <Spec icon={<TbManualGearbox />} label="Transmission" value={`${car.gears}-speed ${formatEnum(car.transmission)}`} />
                                        <Spec icon={<TbArrowAutofitDown />} label="Drivetrain" value={formatEnum(car.drivetrain)} />
                                        <Spec icon={<PiEngine />} label="Engine" value={engineLabel} />
                                        <Spec icon={<BsFuelPump />} label="Fuel" value={formatEnum(car.fuel)} />
                                    </SpecGroup>
                                    <SpecGroup title="Details">
                                        <Spec icon={<BiCar />} label="Body Type" value={formatEnum(car.bodyType)} />
                                        <Spec icon={<MdRoofing />} label="Roof" value={formatEnum(car.roofType)} />
                                        <Spec icon={<GiCarSeat />} label="Seats" value={`${car.seats} seats`} />
                                    </SpecGroup>
                                </div>
                            </div>

                            {/* Description */}
                            {car.description && (
                                <div className={carStyles.descriptionSection}>
                                    <p className={carStyles.descriptionTitle}>Description</p>
                                    <div className={carStyles.description}>
                                        <Markdown>{car.description}</Markdown>
                                    </div>
                                </div>
                            )}

                            {/* Reviews */}
                            <ReviewsSection
                                initialReviews={reviews}
                                vin={car.vin}
                                carName={`${car.modelYear} ${car.make} ${car.model}`}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseCarPreviewPanel;
