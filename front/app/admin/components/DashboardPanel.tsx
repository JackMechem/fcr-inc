"use client";

import { useEffect, useState } from "react";
import { getFilteredCarsAdmin } from "@/app/lib/AdminApiCalls";
import { Car } from "@/app/types/CarTypes";
import { useAdminSidebarStore, AdminView } from "@/stores/adminSidebarStore";
import { BiCar, BiPlus, BiEdit, BiTable, BiCalendar } from "react-icons/bi";
import { MdAttachMoney, MdSpeed, MdDirectionsCar } from "react-icons/md";
import styles from "./dashboardPanel.module.css";

// ── Helpers ──
const avg = (nums: number[]) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

const countBy = (cars: Car[], key: keyof Car): Record<string, number> =>
  cars.reduce<Record<string, number>>((acc, car) => {
    const val = String(car[key] ?? "Unknown");
    acc[val] = (acc[val] ?? 0) + 1;
    return acc;
  }, {});

const fmt = (label: string) =>
  label.charAt(0).toUpperCase() + label.slice(1).toLowerCase().replace(/_/g, " ");

// ── Sub-components ──
const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; }) => (
  <div className={styles.statCard}>
    <div className={styles.statLabel}>
      <span className={styles.statIcon}>{icon}</span>
      {label}
    </div>
    <p className={styles.statValue}>{value}</p>
    {sub && <p className={styles.statSub}>{sub}</p>}
  </div>
);

const BreakdownBar = ({ label, count, total }: { label: string; count: number; total: number; }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5pt" }}>
        <span style={{ color: "var(--color-foreground)", fontWeight: 500 }}>{fmt(label)}</span>
        <span style={{ color: "var(--color-foreground-light)" }}>{count} · {pct}%</span>
      </div>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const NAV_SECTIONS = [
  {
    id: "cars",
    icon: <BiCar />,
    label: "Cars",
    items: [
      { icon: <BiPlus />, label: "Add Car", view: "add-car" as AdminView },
      { icon: <BiEdit />, label: "Edit Car", view: "edit-car" as AdminView },
      { icon: <BiTable />, label: "View Data", view: "view-data" as AdminView },
    ],
  },
  {
    id: "reservations",
    icon: <BiCalendar />,
    label: "Reservations",
    items: [
      { icon: <BiTable />, label: "View Data", view: "view-reservations" as AdminView },
    ],
  },
];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className={styles.sectionTitle}>{children}</p>
);

const DashboardPanel = () => {
  const { setActiveView } = useAdminSidebarStore();
  const [cars, setCars] = useState<Car[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFilteredCarsAdmin({ pageSize: 500 })
      .then((res) => {
        setCars(res.data);
        setTotalItems(res.totalItems);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[1, 2, 3].map((i) => <div key={i} className={styles.pulse} />)}
      </div>
    );
  }

  if (error) return <p style={{ color: "var(--color-accent)" }}>Error: {error}</p>;

  const prices = cars.map((c) => c.pricePerDay).filter(Boolean);
  const hps = cars.map((c) => c.horsepower).filter(Boolean);
  const topCars = [...cars].sort((a, b) => b.pricePerDay - a.pricePerDay).slice(0, 5);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Fleet overview and quick actions</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard icon={<BiCar />} label="Total Vehicles" value={totalItems} />
        <StatCard icon={<MdDirectionsCar />} label="Unique Makes" value={new Set(cars.map(c => c.make)).size} />
        <StatCard icon={<MdAttachMoney />} label="Avg Price / Day" value={`$${avg(prices)}`} sub={`Range: $${Math.min(...prices)} – $${Math.max(...prices)}`} />
        <StatCard icon={<MdSpeed />} label="Avg Horsepower" value={`${avg(hps)} hp`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
        {[{t: "Body Type", d: countBy(cars, "bodyType")}, {t: "Vehicle Class", d: countBy(cars, "vehicleClass")}, {t: "Fuel Type", d: countBy(cars, "fuel")}].map((block, i) => (
          <div key={i} className={styles.breakdownCard}>
            <SectionTitle>{block.t}</SectionTitle>
            {Object.entries(block.d).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
              <BreakdownBar key={label} label={label} count={count} total={cars.length} />
            ))}
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}><SectionTitle>Top 5 by Price / Day</SectionTitle></div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Vehicle</th>
              <th className={styles.th}>Year</th>
              <th className={styles.th}>Class</th>
              <th className={styles.th} style={{ textAlign: "right" }}>Price / Day</th>
            </tr>
          </thead>
          <tbody>
            {topCars.map((car, i) => (
              <tr key={car.vin} className={i % 2 !== 0 ? styles.trStripe : ""}>
                <td className={styles.td} style={{ fontWeight: 500 }}>{car.make} {car.model}</td>
                <td className={styles.td} style={{ color: "var(--color-foreground-light)" }}>{car.modelYear}</td>
                <td className={styles.td} style={{ color: "var(--color-foreground-light)" }}>{fmt(car.vehicleClass)}</td>
                <td className={styles.td} style={{ color: "var(--color-accent)", fontWeight: 600, textAlign: "right" }}>${car.pricePerDay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <SectionTitle>Sections</SectionTitle>
        <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className={styles.navSectionCard}>
              <div className={styles.navSectionHeader}>
                <span className={styles.statIcon} style={{ fontSize: "18pt" }}>{section.icon}</span>
                <span style={{ fontWeight: 600 }}>{section.label}</span>
              </div>
              {section.items.map((item) => (
                <button key={String(item.view)} onClick={() => setActiveView(item.view)} className={styles.navButton}>
                  <span style={{ fontSize: "16pt", color: "var(--color-foreground-light)" }}>{item.icon}</span>
                  <span style={{ fontSize: "11pt", fontWeight: 500 }}>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;
