package com.inc.fcr.database;

import com.inc.fcr.ValidationException;
import com.inc.fcr.car.Car;
import com.inc.fcr.car.enums.*;

import org.jooq.*;
import org.jooq.Record;
import org.jooq.impl.DSL;

import java.sql.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;


import static org.jooq.impl.DSL.*;

public class DatabaseController {

    private static final Set<String> VALID_COLUMNS = new HashSet<>(Arrays.asList(
            "vin", "make", "model", "model_year", "description", "num_cylinders", "gears",
            "horsepower", "torque", "seats", "price_per_day", "mpg", "transmission",
            "drivetrain", "engine_layout", "fuel", "images", "features", "rootype", "vehicle_class", "body_type"));

    // jOOQ table/field references
    private static final Table<Record> CARS = table("cars");
    private static final Field<String> VIN = field(name("vin"), String.class);
    private static final Field<String> MAKE = field(name("make"), String.class);
    private static final Field<String> MODEL = field(name("model"), String.class);
    private static final Field<Integer> MODEL_YEAR = field(name("model_year"), Integer.class);
    private static final Field<String> DESCRIPTION = field(name("description"), String.class);
    private static final Field<Integer> NUM_CYLINDERS = field(name("num_cylinders"), Integer.class);
    private static final Field<Integer> GEARS = field(name("gears"), Integer.class);
    private static final Field<Integer> HORSEPOWER = field(name("horsepower"), Integer.class);
    private static final Field<Integer> TORQUE = field(name("torque"), Integer.class);
    private static final Field<Integer> SEATS = field(name("seats"), Integer.class);
    private static final Field<Double> PRICE_PER_DAY = field(name("price_per_day"), Double.class);
    private static final Field<Double> MPG = field(name("mpg"), Double.class);
    private static final Field<String> TRANSMISSION = field(name("transmission"), String.class);
    private static final Field<String> FUEL = field(name("fuel"), String.class);
    private static final Field<String> ENGINE_LAYOUT = field(name("engine_layout"), String.class);
    private static final Field<String> DRIVETRAIN = field(name("drivetrain"), String.class);
    private static final Field<String> FEATURES = field(name("features"), String.class);
    private static final Field<String> IMAGES = field(name("images"), String.class);
    private static final Field<String> ROOF_TYPE = field(name("roof_type"), String.class);
    private static final Field<String> VEHICLE_CLASS = field(name("vehicle_class"), String.class);
    private static final Field<String> BODY_TYPE = field(name("body_type"), String.class);

    /*
     * Helper Functions
     */

    private static String sanitizeColumns(String[] columns) {
        if (columns == null || columns.length == 0)
            return "*";

        String[] valid = Arrays.stream(columns)
                .filter(VALID_COLUMNS::contains)
                .toArray(String[]::new);

        if (valid.length == 0)
            return "*";

        return String.join(", ", valid);
    }

    private static String requireEnv(String key) {
        String v = System.getenv(key);
        if (v == null || v.isBlank()) {
            throw new IllegalStateException("Missing environment variable: " + key);
        }
        return v;
    }

    private static <E extends Enum<E>> E enumFromToString(Class<E> enumClass, String dbValue) {
        if (dbValue == null) {
            throw new IllegalArgumentException("DB value is null for enum " + enumClass.getSimpleName());
        }
        String normalized = dbValue.trim();
        for (E e : enumClass.getEnumConstants()) {
            if (e.toString().equalsIgnoreCase(normalized)) {
                return e;
            }
        }
        throw new IllegalArgumentException(
                "Unknown " + enumClass.getSimpleName() + " value from DB: '" + dbValue + "'");
    }

    private static ArrayList<String> jsonToStringArrayList(String json) {
        ArrayList<String> out = new ArrayList<>();
        if (json != null && !json.equals("[]")) {
            json = json.replace("[", "").replace("]", "").replace("\"", "");
            String[] parts = json.split(",");
            for (String part : parts) {
                out.add(part.trim());
            }
        }
        return out;
    }

    private static String toJsonArray(ArrayList<String> list) {
        if (list == null || list.isEmpty())
            return "[]";
        return "[" + list.stream()
                .map(s -> "\"" + s + "\"")
                .collect(Collectors.joining(",")) + "]";
    }

    /**
     * Maps a jOOQ Record to a Car, reusing existing enum/json helpers.
     */
    private static Car recordToCar(Record r) throws ValidationException {
        return new Car(
                r.get(VIN),
                r.get(MAKE),
                r.get(MODEL),
                r.get(MODEL_YEAR) != null ? r.get(MODEL_YEAR) : 2080,
                r.get(DESCRIPTION),
                r.get(NUM_CYLINDERS) != null ? r.get(NUM_CYLINDERS) : 0,
                r.get(GEARS) != null ? r.get(GEARS) : 1,
                r.get(HORSEPOWER) != null ? r.get(HORSEPOWER) : 0,
                r.get(TORQUE) != null ? r.get(TORQUE) : 0,
                r.get(SEATS) != null ? r.get(SEATS) : 0,
                r.get(PRICE_PER_DAY) != null ? r.get(PRICE_PER_DAY) : 0.0,
                r.get(MPG) != null ? r.get(MPG) : 0.0,
                jsonToStringArrayList(r.get(FEATURES)),
                jsonToStringArrayList(r.get(IMAGES)),
                r.get(TRANSMISSION) != null ? enumFromToString(TransmissionType.class, r.get(TRANSMISSION)) : null,
                r.get(DRIVETRAIN) != null ? enumFromToString(Drivetrain.class, r.get(DRIVETRAIN)) : null,
                r.get(ENGINE_LAYOUT) != null ? enumFromToString(EngineLayout.class, r.get(ENGINE_LAYOUT)) : null,
                r.get(FUEL) != null ? enumFromToString(FuelType.class, r.get(FUEL)) : null,
                r.get(BODY_TYPE) != null ? enumFromToString(BodyType.class, r.get(BODY_TYPE)) : null,
                r.get(ROOF_TYPE) != null ? enumFromToString(RoofType.class, r.get(ROOF_TYPE)) : null,
                r.get(VEHICLE_CLASS) != null ? enumFromToString(VehicleClass.class, r.get(VEHICLE_CLASS)) : null);
    }

    /*
     * Database Connection (legacy JDBC — kept for existing methods)
     */

    protected static final String url = requireEnv("DB_URL");
    protected static final String user = requireEnv("DB_USER");
    protected static final String pass = requireEnv("DB_PASSWORD");
    protected static final Connection conn = dbConnect();

    protected static Connection dbConnect() {
        try {
            return DriverManager.getConnection(url, user, pass);
        } catch (Exception e) {
            throw new RuntimeException("Failed to connect to database: " + e);
        }
    }

    // =========================================================================
    // LEGACY JDBC METHODS (unchanged)
    // =========================================================================

    /* POST */

    // TODO: Add features and images - refactor
    public static void insertCar(Car car) throws SQLException {
        final String checkSQL = "SELECT 1 FROM cars WHERE vin = ?";
        final String insertSQL =
                "INSERT INTO cars " +
                        "(vin, make, model, model_year, description, num_cylinders, gears, horsepower, torque, seats, " +
                        " price_per_day, mpg, transmission, fuel, engine_layout, drivetrain, features, images, roof_type, vehicle_class, body_type) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,? ,?)";

        try (PreparedStatement checkStmt = conn.prepareStatement(checkSQL);
             PreparedStatement insertStmt = conn.prepareStatement(insertSQL)) {

            checkStmt.setString(1, car.getVin());
            try (ResultSet rs = checkStmt.executeQuery()) {
                if (rs.next()) {
                    System.out.println("insert failed: VIN already exists");
                    return;
                }
            }

            insertStmt.setString(1, car.getVin());
            insertStmt.setString(2, car.getMake());
            insertStmt.setString(3, car.getModel());
            insertStmt.setInt(4, car.getYear());
            insertStmt.setString(5, car.getDescription());
            insertStmt.setInt(6, car.getCylinders());
            insertStmt.setInt(7, car.getGears());
            insertStmt.setInt(8, car.getHorsepower());
            insertStmt.setInt(9, car.getTorque());
            insertStmt.setInt(10, car.getSeats());
            insertStmt.setDouble(11, car.getPricePerDay());
            insertStmt.setDouble(12, car.getMpg());
            insertStmt.setString(13, car.getTransmission().toString());
            insertStmt.setString(14, car.getFuel().toString());
            insertStmt.setString(15, car.getEngineLayout().toString());
            insertStmt.setString(16, car.getDrivetrain().toString());
            insertStmt.setObject(17, toJsonArray(car.getFeatures()));
            insertStmt.setObject(18, toJsonArray(car.getImages()));
            insertStmt.setString(19, car.getRoofType().toString());
            insertStmt.setString(20, car.getVehicleClass().toString());
            insertStmt.setString(21, car.getBodyType().toString());

            int rows = insertStmt.executeUpdate();
            System.out.println(rows == 1 ? "insert successful" : "insert failed");

        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }
    }

    /* DELETE */

    public static void deleteCar(String vin) throws SQLException {
        final String sql = "DELETE FROM cars WHERE vin = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, vin);
            stmt.executeUpdate();
        }
    }

    /* PATCH */

    public static void updateCar(Car car) throws SQLException {
        // TODO
    }

    /* GET */

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int DEFAULT_PAGE = 1;

    public static ArrayList<Car> getCarDB() throws ValidationException, SQLException {
        return getCarDB(-1, -1, new String[0]);
    }

    public static ArrayList<Car> getCarDB(String[] columns) throws ValidationException, SQLException {
        return getCarDB(-1, -1, columns);
    }

    public static ArrayList<Car> getCarDB(int page, int pageSize, String[] columns)
            throws ValidationException, SQLException {

        if (page <= 0) page = DEFAULT_PAGE;
        if (pageSize <= -1) pageSize = DEFAULT_PAGE_SIZE;

        String selectCols = sanitizeColumns(columns);
        boolean paginate = pageSize != 0;
        String sql = "SELECT " + selectCols + " FROM cars" + (paginate ? " LIMIT ? OFFSET ?" : "");

        Set<String> colSet = (columns == null || columns.length == 0) ? null
                : new HashSet<>(Arrays.asList(columns));

        ArrayList<Car> cars = new ArrayList<>();
        int offset = (page - 1) * pageSize;

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (paginate) {
                stmt.setInt(1, pageSize);
                stmt.setInt(2, offset);
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    try {
                        TransmissionType transmission = hasCol(colSet, "transmission")
                                ? enumFromToString(TransmissionType.class, rs.getString("transmission")) : null;
                        Drivetrain drivetrain = hasCol(colSet, "drivetrain")
                                ? enumFromToString(Drivetrain.class, rs.getString("drivetrain")) : null;
                        EngineLayout engineLayout = hasCol(colSet, "engine_layout")
                                ? enumFromToString(EngineLayout.class, rs.getString("engine_layout")) : null;
                        FuelType fuel = hasCol(colSet, "fuel")
                                ? enumFromToString(FuelType.class, rs.getString("fuel")) : null;
                        BodyType bodyType = hasCol(colSet, "body_type")
                                ? enumFromToString(BodyType.class, rs.getString("body_type")) : null;
                        RoofType roofType = hasCol(colSet, "roof_type")
                                ? enumFromToString(RoofType.class, rs.getString("roof_type")) : null;
                        VehicleClass vehicleClass = hasCol(colSet, "vehicle_class")
                                ? enumFromToString(VehicleClass.class, rs.getString("vehicle_class")) : null;

                        ArrayList<String> features = new ArrayList<>();
                        if (hasCol(colSet, "features")) {
                            String featuresJson = rs.getString("features");
                            if (featuresJson != null && !featuresJson.equals("[]")) {
                                featuresJson = featuresJson.replace("[", "").replace("]", "").replace("\"", "");
                                for (String part : featuresJson.split(","))
                                    features.add(part.trim());
                            }
                        }

                        ArrayList<String> images = new ArrayList<>();
                        if (hasCol(colSet, "images")) {
                            String imagesJson = rs.getString("images");
                            if (imagesJson != null && !imagesJson.equals("[]")) {
                                imagesJson = imagesJson.replace("[", "").replace("]", "").replace("\"", "");
                                for (String part : imagesJson.split(","))
                                    images.add(part.trim());
                            }
                        }

                        cars.add(new Car(
                                hasCol(colSet, "vin") ? rs.getString("vin") : null,
                                hasCol(colSet, "make") ? rs.getString("make") : null,
                                hasCol(colSet, "model") ? rs.getString("model") : null,
                                hasCol(colSet, "model_year") ? rs.getInt("model_year") : 2080,
                                hasCol(colSet, "description") ? rs.getString("description") : null,
                                hasCol(colSet, "num_cylinders") ? rs.getInt("num_cylinders") : 0,
                                hasCol(colSet, "gears") ? rs.getInt("gears") : 1,
                                hasCol(colSet, "horsepower") ? rs.getInt("horsepower") : 0,
                                hasCol(colSet, "torque") ? rs.getInt("torque") : 0,
                                hasCol(colSet, "seats") ? rs.getInt("seats") : 0,
                                hasCol(colSet, "price_per_day") ? rs.getDouble("price_per_day") : 0,
                                hasCol(colSet, "mpg") ? rs.getDouble("mpg") : 0,
                                features, images,
                                transmission, drivetrain, engineLayout, fuel,
                                bodyType, roofType, vehicleClass));

                    } catch (IllegalArgumentException iae) {
                        System.err.println("Skipping row due to enum mismatch (vin=" + rs.getString("vin") + "): "
                                + iae.getMessage());
                    }
                }
            }
        }
        return cars;
    }

    private static boolean hasCol(Set<String> colSet, String col) {
        return colSet == null || colSet.contains(col);
    }

    public static Car getCarFromVin(String vin) throws ValidationException, SQLException {
        final String sql =
                "SELECT vin, make, model, model_year, description, num_cylinders, gears, " +
                        "horsepower, torque, seats, price_per_day, mpg, transmission, drivetrain, engine_layout, fuel, " +
                        "images, features, vehicle_class, body_type, roof_type FROM cars WHERE vin = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, vin);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    try {
                        return new Car(
                                rs.getString("vin"),
                                rs.getString("make"),
                                rs.getString("model"),
                                rs.getInt("model_year"),
                                rs.getString("description"),
                                rs.getInt("num_cylinders"),
                                rs.getInt("gears"),
                                rs.getInt("horsepower"),
                                rs.getInt("torque"),
                                rs.getInt("seats"),
                                rs.getDouble("price_per_day"),
                                rs.getDouble("mpg"),
                                jsonToStringArrayList(rs.getString("features")),
                                jsonToStringArrayList(rs.getString("images")),
                                enumFromToString(TransmissionType.class, rs.getString("transmission")),
                                enumFromToString(Drivetrain.class, rs.getString("drivetrain")),
                                enumFromToString(EngineLayout.class, rs.getString("engine_layout")),
                                enumFromToString(FuelType.class, rs.getString("fuel")),
                                enumFromToString(BodyType.class, rs.getString("body_type")),
                                enumFromToString(RoofType.class, rs.getString("roof_type")),
                                enumFromToString(VehicleClass.class, rs.getString("vehicle_class")));
                    } catch (IllegalArgumentException iae) {
                        System.err.println("Skipping row due to enum mismatch (vin=" + rs.getString("vin") + "): "
                                + iae.getMessage());
                    }
                }
            }
        }
        return null;
    }

    // =========================================================================
    // jOOQ METHODS
    // =========================================================================

    /**
     * [jOOQ] Insert a car. Skips insert if the VIN already exists.
     * Replaces: insertCar(Car)
     */
    public static void insertCarJooq(Car car) {
        DSLContext ctx = Jooq.ctx();

        boolean exists = ctx.fetchExists(
                ctx.selectOne().from(CARS).where(VIN.eq(car.getVin())));

        if (exists) {
            System.out.println("insert failed: VIN already exists");
            return;
        }

        int rows = ctx.insertInto(CARS)
                .set(VIN, car.getVin())
                .set(MAKE, car.getMake())
                .set(MODEL, car.getModel())
                .set(MODEL_YEAR, car.getYear())
                .set(DESCRIPTION, car.getDescription())
                .set(NUM_CYLINDERS, car.getCylinders())
                .set(GEARS, car.getGears())
                .set(HORSEPOWER, car.getHorsepower())
                .set(TORQUE, car.getTorque())
                .set(SEATS, car.getSeats())
                .set(PRICE_PER_DAY, car.getPricePerDay())
                .set(MPG, car.getMpg())
                .set(TRANSMISSION, car.getTransmission().toString())
                .set(FUEL, car.getFuel().toString())
                .set(ENGINE_LAYOUT, car.getEngineLayout().toString())
                .set(DRIVETRAIN, car.getDrivetrain().toString())
                .set(FEATURES, toJsonArray(car.getFeatures()))
                .set(IMAGES, toJsonArray(car.getImages()))
                .set(ROOF_TYPE, car.getRoofType().toString())
                .set(VEHICLE_CLASS, car.getVehicleClass().toString())
                .set(BODY_TYPE, car.getBodyType().toString())
                .execute();

        System.out.println(rows == 1 ? "insert successful" : "insert failed");
    }

    public static void deleteCarJooq(String vin) {
        Jooq.ctx()
                .deleteFrom(CARS)
                .where(VIN.eq(vin))
                .execute();
    }

    public static void updateCarJooq(Car car) {
        var step = Jooq.ctx().update(CARS);

        // Build update dynamically so partial updates are supported
        var set = step
                .set(MAKE, car.getMake())
                .set(MODEL, car.getModel())
                .set(MODEL_YEAR, car.getYear())
                .set(DESCRIPTION, car.getDescription())
                .set(NUM_CYLINDERS, car.getCylinders())
                .set(GEARS, car.getGears())
                .set(HORSEPOWER, car.getHorsepower())
                .set(TORQUE, car.getTorque())
                .set(SEATS, car.getSeats())
                .set(PRICE_PER_DAY, car.getPricePerDay())
                .set(MPG, car.getMpg())
                .set(FEATURES, toJsonArray(car.getFeatures()))
                .set(IMAGES, toJsonArray(car.getImages()));

        if (car.getTransmission() != null) set = set.set(TRANSMISSION, car.getTransmission().toString());
        if (car.getFuel() != null) set = set.set(FUEL, car.getFuel().toString());
        if (car.getEngineLayout() != null) set = set.set(ENGINE_LAYOUT, car.getEngineLayout().toString());
        if (car.getDrivetrain() != null) set = set.set(DRIVETRAIN, car.getDrivetrain().toString());
        if (car.getRoofType() != null) set = set.set(ROOF_TYPE, car.getRoofType().toString());
        if (car.getVehicleClass() != null) set = set.set(VEHICLE_CLASS, car.getVehicleClass().toString());
        if (car.getBodyType() != null) set = set.set(BODY_TYPE, car.getBodyType().toString());

        int rows = set.where(VIN.eq(car.getVin())).execute();
        System.out.println(rows == 1 ? "update successful" : "update failed (vin not found?)");
    }

    public static ArrayList<Car> getCarDBJooq() {
        return getCarDBJooq(0, 0);
    }

    public static ArrayList<Car> getCarDBJooq(int page, int pageSize) {
        if (page <= 0) page = DEFAULT_PAGE;
        if (pageSize < 0) pageSize = DEFAULT_PAGE_SIZE;

        DSLContext ctx = Jooq.ctx();
        SelectLimitStep<Record> query = ctx.select().from(CARS);

        List<Record> records = (pageSize == 0)
                ? query.fetch()
                : query.limit(pageSize).offset((long) (page - 1) * pageSize).fetch();

        ArrayList<Car> cars = new ArrayList<>();
        for (Record r : records) {
            try {
                cars.add(recordToCar(r));
            } catch (IllegalArgumentException iae) {
                System.err.println("Skipping row due to enum mismatch (vin=" + r.get(VIN) + "): "
                        + iae.getMessage());
            } catch (ValidationException e) {
                throw new RuntimeException(e);
            }
        }
        return cars;
    }

    public static Car getCarFromVinJooq(String vin) {
        Record r = Jooq.ctx()
                .select()
                .from(CARS)
                .where(VIN.eq(vin))
                .fetchOne();

        if (r == null) return null;

        try {
            return recordToCar(r);
        } catch (IllegalArgumentException iae) {
            System.err.println("Skipping row due to enum mismatch (vin=" + vin + "): " + iae.getMessage());
            return null;
        } catch (ValidationException e) {
            throw new RuntimeException(e);
        }
    }
}
