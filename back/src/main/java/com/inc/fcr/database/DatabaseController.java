package com.inc.fcr.database;

import com.inc.fcr.ValidationException;
import com.inc.fcr.car.Car;
import com.inc.fcr.car.enums.*;

import java.sql.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class DatabaseController {

    private static final Set<String> VALID_COLUMNS = new HashSet<>(Arrays.asList(
            "vin", "make", "model", "model_year", "description", "num_cylinders", "gears",
            "horsepower", "torque", "seats", "price_per_day", "mpg", "transmission",
            "drivetrain", "engine_layout", "fuel", "images", "features", "roof_type", "vehicle_class", "body_type"));

    private static String sanitizeColumns(String[] columns) {
        if (columns == null || columns.length == 0)
            return "*";

        String[] valid = Arrays.stream(columns)
                .filter(VALID_COLUMNS::contains)
                .toArray(String[]::new);

        if (valid.length == 0)
            return "*"; // fallback to all if nothing valid passed

        return String.join(", ", valid);
    }

    /*
     * Helper Functions
     */

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
        ArrayList<String> out = new ArrayList<String>();
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

    /*
     * Database Connection
     */

    protected static final String url = requireEnv("DB_URL");
    protected static final String user = requireEnv("DB_USER");
    protected static final String pass = requireEnv("DB_PASSWORD");
    protected static final Connection conn = dbConnect();

    protected static Connection dbConnect() {
        try {
            return (DriverManager.getConnection(url, user, pass));
        } catch (Exception e) {
            throw new RuntimeException("Failed to connect to database: " + e);
        }
    }

    /*
     * POST / PATCH
     */

    // TODO: Add features and images - refactor
    public static void insertCar(Car car) throws SQLException {
        final String checkSQL = "SELECT 1 FROM cars WHERE vin = ?";

        final String insertSQL = "INSERT INTO cars " +
                "(vin, make, model, model_year, description, num_cylinders, gears, horsepower, torque, seats, " +
                " price_per_day, mpg, transmission, fuel, engine_layout, drivetrain, features, images, roof_type, vehicle_class, body_type) "
                +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,? ,?)";

        try (PreparedStatement checkStmt = conn.prepareStatement(checkSQL);
                PreparedStatement insertStmt = conn.prepareStatement(insertSQL)) {

            // Check duplicate VIN
            checkStmt.setString(1, car.getVin());
            try (ResultSet rs = checkStmt.executeQuery()) {
                if (rs.next()) {
                    System.out.println("insert failed: VIN already exists");
                    return;
                }
            }

            // Bind parameters in the SAME order as the columns in insertSQL
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

            // Stored as enum.toString()
            insertStmt.setString(13, car.getTransmission().toString());
            insertStmt.setString(14, car.getFuel().toString());
            insertStmt.setString(15, car.getEngineLayout().toString());
            insertStmt.setString(16, car.getDrivetrain().toString());
            insertStmt.setObject(17, toJsonArray(car.getFeatures()));
            insertStmt.setObject(18, toJsonArray(car.getImages()));
            insertStmt.setString(19, car.getRoofType().toString());
            insertStmt.setString(20, car.getVehicleClassProperty().toString());
            insertStmt.setString(21, car.getBodyType().toString());

            int rows = insertStmt.executeUpdate();
            System.out.println(rows == 1 ? "insert successful" : "insert failed");

        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }
    }

    /*
     * DELETE
     */
    public static void deleteCar(String vin) throws SQLException {
        final String sql = "DELETE FROM cars WHERE vin = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, vin);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw e;
        }
    }

    /*
     * GET
     */

    private static final int DEFAULT_PAGE_SIZE = 5;
    private static final int DEFAULT_PAGE = 1;

    public static ArrayList<Car> getCarDB() throws ValidationException {
        return getCarDB(-1, -1, new String[0]);
    }

    public static ArrayList<Car> getCarDB(String[] columns) throws ValidationException {
        return getCarDB(-1, -1, columns);
    }

    public static ArrayList<Car> getCarDB(int page, int pageSize, String[] columns) throws ValidationException {
        if (page <= 0)
            page = DEFAULT_PAGE;
        if (pageSize <= 0)
            pageSize = DEFAULT_PAGE_SIZE;

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
                                ? enumFromToString(TransmissionType.class, rs.getString("transmission"))
                                : null;
                        Drivetrain drivetrain = hasCol(colSet, "drivetrain")
                                ? enumFromToString(Drivetrain.class, rs.getString("drivetrain"))
                                : null;
                        EngineLayout engineLayout = hasCol(colSet, "engine_layout")
                                ? enumFromToString(EngineLayout.class, rs.getString("engine_layout"))
                                : null;
                        FuelType fuel = hasCol(colSet, "fuel")
                                ? enumFromToString(FuelType.class, rs.getString("fuel"))
                                : null;
                        BodyType bodyType = hasCol(colSet, "body_type")
                                ? enumFromToString(BodyType.class, rs.getString("body_type"))
                                : null;
                        RoofType roofType = hasCol(colSet, "roof_type")
                                ? enumFromToString(RoofType.class, rs.getString("roof_type"))
                                : null;
                        VehicleClass vehicleClassProperty = hasCol(colSet, "vehicle_class")
                                ? enumFromToString(VehicleClass.class, rs.getString("vehicle_class"))
                                : null;

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

                        Car car = new Car(
                                hasCol(colSet, "vin") ? rs.getString("vin") : null,
                                hasCol(colSet, "make") ? rs.getString("make") : null,
                                hasCol(colSet, "model") ? rs.getString("model") : null,
                                hasCol(colSet, "model_year") ? rs.getInt("model_year") : 0,
                                hasCol(colSet, "description") ? rs.getString("description") : null,
                                hasCol(colSet, "num_cylinders") ? rs.getInt("num_cylinders") : 0,
                                hasCol(colSet, "gears") ? rs.getInt("gears") : 0,
                                hasCol(colSet, "horsepower") ? rs.getInt("horsepower") : 0,
                                hasCol(colSet, "torque") ? rs.getInt("torque") : 0,
                                hasCol(colSet, "seats") ? rs.getInt("seats") : 0,
                                hasCol(colSet, "price_per_day") ? rs.getDouble("price_per_day") : 0,
                                hasCol(colSet, "mpg") ? rs.getDouble("mpg") : 0,
                                features, images,
                                transmission, drivetrain, engineLayout, fuel,
                                bodyType, roofType, vehicleClassProperty);
                        cars.add(car);
                    } catch (IllegalArgumentException iae) {
                        System.err.println("Skipping row due to enum mismatch (vin=" + rs.getString("vin") + "): "
                                + iae.getMessage());
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return cars;
    }

    // null colSet means all columns were requested
    private static boolean hasCol(java.util.Set<String> colSet, String col) {
        return colSet == null || colSet.contains(col);
    }

    public static Car getCarFromVin(String vin) throws ValidationException {
        final String sql = "SELECT vin, make, model, model_year, description, num_cylinders, gears, " +
                "horsepower, torque, seats, price_per_day, mpg, transmission, drivetrain, engine_layout, fuel, images, features,vehicle_class,body_type,roof_type "
                +
                "FROM cars WHERE vin = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, vin);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    try {

                        TransmissionType transmission = enumFromToString(TransmissionType.class,
                                rs.getString("transmission"));

                        Drivetrain drivetrain = enumFromToString(Drivetrain.class, rs.getString("drivetrain"));

                        EngineLayout engineLayout = enumFromToString(EngineLayout.class, rs.getString("engine_layout"));

                        FuelType fuel = enumFromToString(FuelType.class, rs.getString("fuel"));

                        VehicleClass vehicleClassProperty = enumFromToString(VehicleClass.class,
                                rs.getString("vehicle_class"));

                        RoofType roofType = enumFromToString(RoofType.class, rs.getString("roof_type"));

                        BodyType bodyType = enumFromToString(BodyType.class, rs.getString("body_type"));

                        ArrayList<String> features = jsonToStringArrayList(rs.getString("features"));
                        ArrayList<String> images = jsonToStringArrayList(rs.getString("images"));

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
                                features,
                                images,
                                transmission,
                                drivetrain,
                                engineLayout,
                                fuel,
                                bodyType,
                                roofType,
                                vehicleClassProperty);

                    } catch (IllegalArgumentException iae) {
                        System.err.println(
                                "Skipping row due to enum mismatch (vin=" + rs.getString("vin") + "): "
                                        + iae.getMessage());
                    }
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }

    /**
     * SORT BY ATTRIBUTE
     * Sort by transmission type, fuel type, drivetrain, body_type, vehicle_class,
     * price per day.
     */

    // private static String sortByAttribute(Sort data){
    // return switch(data){
    // case TRANSMISSION -> "transmission";
    // case FUEL -> "fuel";
    // case DRIVETRAIN -> "drivetrain";
    // case BODY_TYPE -> "body_type";
    // case VEHICLE_CLASS -> "vehicle_class";
    // case PRICE_PER_DAY -> "price_per_pday";
    // };
    // }

}
