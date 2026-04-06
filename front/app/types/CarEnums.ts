// AUTO-GENERATED — do not edit manually

export type BodyType = "SEDAN" | "SUV" | "TRUCK" | "CONVERTIBLE" | "HATCHBACK" | "FULL_SIZE" | "COMPACT" | "WAGON" | "ELECTRIC" | "COUPE";

export type EngineLayout = "V" | "INLINE" | "FLAT" | "SINGLE_MOTOR" | "DUAL_MOTOR";

export type FuelType = "GASOLINE" | "DIESEL" | "ELECTRIC" | "HYBRID";

export type RoofType = "SOFTTOP" | "HARDTOP" | "TARGA" | "SLICKTOP" | "SUNROOF" | "PANORAMIC";

export type VehicleClass = "ECONOMY" | "LUXURY" | "PERFORMANCE" | "OFFROAD" | "FULL_SIZE" | "ELECTRIC";

export type TransmissionType = "AUTOMATIC" | "MANUAL";

export type Drivetrain = "FWD" | "RWD" | "AWD";

export interface CarEnums {
    bodyType: BodyType[];
    engineLayout: EngineLayout[];
    fuelType: FuelType[];
    roofType: RoofType[];
    vehicleClass: VehicleClass[];
    transmissionType: TransmissionType[];
    drivetrain: Drivetrain[];
}
