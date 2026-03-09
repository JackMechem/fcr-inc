package com.inc.fcr.database;

import com.inc.fcr.ValidationException;
import com.inc.fcr.car.Car;
import com.inc.fcr.car.enums.Drivetrain;
import com.inc.fcr.car.enums.EngineLayout;
import com.inc.fcr.car.enums.FuelType;
import com.inc.fcr.car.enums.TransmissionType;

import java.sql.*;
import java.util.ArrayList;

public class DatabaseController {

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

    /*
     * Database Connection
     */

    static String url = requireEnv("DB_URL");
    static String user = requireEnv("DB_USER");
    static String pass = requireEnv("DB_PASSWORD");
    static final Connection conn = dbConnect();

    public static Connection dbConnect() {
        try {
            return (DriverManager.getConnection(url, user, pass));
        } catch (Exception e) {
            throw new RuntimeException("Failed to connect to database: " + e);
        }
    }

    /*
     * POST / PATCH
     */

    // TODO: Add features and images
    public static void insertCar(Car car) {
        final String checkSQL = "SELECT 1 FROM cars WHERE vin = ?";

        final String insertSQL = "INSERT INTO cars " +
                "(vin, make, model, model_year, description, num_cylinders, gears, horsepower, torque, seats, " +
                " priceperday, mpg, transmission, fuel, engineLayout, drivetrain) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

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

            int rows = insertStmt.executeUpdate();
            System.out.println(rows == 1 ? "insert successful" : "insert failed");

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    /*
     * DELETE
     */
    public static boolean deleteCar(String vin) {
        final String sql = "DELETE FROM cars WHERE vin = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, vin);
            int rowsAffected = stmt.executeUpdate();
            return rowsAffected > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /*
     * GET
     */

    public static ArrayList<Car> getCarDB() {
        return getCarDB(1, 3);
    }

    public static ArrayList<Car> getCarDB(int page, int pageSize) {
        final String sql = "SELECT vin, make, model, model_year, description, num_cylinders, gears, " +
                "horsepower, torque, seats, priceperday, mpg, transmission, drivetrain, engineLayout, fuel, images, features "
                +
                "FROM cars " + "LIMIT ? OFFSET ?";

        ArrayList<Car> cars = new ArrayList<>();

        int offset = (page - 1) * pageSize;

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, pageSize);
            stmt.setInt(2, offset);
            try (ResultSet rs = stmt.executeQuery()) {

                while (rs.next()) {
                    try {

                        TransmissionType transmission = enumFromToString(TransmissionType.class,
                                rs.getString("transmission"));

                        Drivetrain drivetrain = enumFromToString(Drivetrain.class, rs.getString("drivetrain"));

                        EngineLayout engineLayout = enumFromToString(EngineLayout.class, rs.getString("engineLayout"));

                        FuelType fuel = enumFromToString(FuelType.class, rs.getString("fuel"));

                        String featuresJson = rs.getString("features");

                        ArrayList<String> features = new ArrayList<>();

                        if (featuresJson != null && !featuresJson.equals("[]")) {
                            featuresJson = featuresJson.replace("[", "").replace("]", "").replace("\"", "");
                            String[] parts = featuresJson.split(",");
                            for (String part : parts) {
                                features.add(part.trim());
                            }
                        }

                        String imagesJson = rs.getString("images");

                        ArrayList<String> images = new ArrayList<>();

                        if (imagesJson != null && !imagesJson.equals("[]")) {
                            imagesJson = imagesJson.replace("[", "").replace("]", "").replace("\"", "");
                            String[] parts = imagesJson.split(",");
                            for (String part : parts) {
                                images.add(part.trim());
                            }
                        }

                        Car car = new Car(
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
                                rs.getDouble("priceperday"),
                                rs.getDouble("mpg"),
                                features,
                                images,
                                transmission,
                                drivetrain,
                                engineLayout,
                                fuel);

                        cars.add(car);
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

        return cars;
    }

    public static Car getCarFromVin(String vin) {
        final String sql = "SELECT vin, make, model, model_year, description, num_cylinders, gears, " +
                "horsepower, torque, seats, priceperday, mpg, transmission, drivetrain, engineLayout, fuel, images, features "
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

                        EngineLayout engineLayout = enumFromToString(EngineLayout.class, rs.getString("engineLayout"));

                        FuelType fuel = enumFromToString(FuelType.class, rs.getString("fuel"));

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
                                rs.getDouble("priceperday"),
                                rs.getDouble("mpg"),
                                features,
                                images,
                                transmission,
                                drivetrain,
                                engineLayout,
                                fuel);

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

}
