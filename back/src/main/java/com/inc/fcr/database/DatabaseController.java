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

    private final Connection conn;

    public DatabaseController() throws SQLException {
        String url = requireEnv("DB_URL");
        String user = requireEnv("DB_USER");
        String pass = requireEnv("DB_PASSWORD");
        this.conn = DriverManager.getConnection(url, user, pass);
    }

    private static String requireEnv(String key) {
        String v = System.getenv(key);
        if (v == null || v.isBlank()) {
            throw new IllegalStateException("Missing environment variable: " + key);
        }
        return v;
    }

    public void insertCar(Car car) {
        final String checkSQL = "SELECT 1 FROM cars WHERE vin = ?";

        final String insertSQL =
                "INSERT INTO cars " +
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

    public ArrayList<Car> getCarDB() {
        final String sql =
                "SELECT vin, make, model, model_year, description, num_cylinders, gears, " +
                        "horsepower, torque, seats, priceperday, mpg, transmission, drivetrain, engineLayout, fuel " +
                        "FROM cars";

        ArrayList<Car> cars = new ArrayList<>();

        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                try {
                    ArrayList<String> features = new ArrayList<>(); // until you store features

                    TransmissionType transmission =
                            enumFromToString(TransmissionType.class, rs.getString("transmission"));

                    Drivetrain drivetrain =
                            enumFromToString(Drivetrain.class, rs.getString("drivetrain"));

                    EngineLayout engineLayout =
                            enumFromToString(EngineLayout.class, rs.getString("engineLayout"));

                    FuelType fuel =
                            enumFromToString(FuelType.class, rs.getString("fuel"));

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
                            transmission,
                            drivetrain,
                            engineLayout,
                            fuel
                    );

                    cars.add(car);

                } catch (IllegalArgumentException iae) {
                    System.err.println(
                            "Skipping row due to enum mismatch (vin=" + rs.getString("vin") + "): " + iae.getMessage()
                    );
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return cars;
    }

    // Maps DB string -> enum by comparing enum.toString() (case-insensitive)
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
                "Unknown " + enumClass.getSimpleName() + " value from DB: '" + dbValue + "'"
        );
    }
}