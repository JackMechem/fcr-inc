package com.inc.fcr.database;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private static final ObjectMapper mapper = new ObjectMapper();
    private static ArrayList<String> jsonToStringArrayList(String json) throws JsonProcessingException {
        return mapper.readValue(json, new TypeReference<ArrayList<String>>(){});
    }
    private static String toJsonArray(ArrayList<String> list) throws JsonProcessingException {
        return mapper.writeValueAsString(list);
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
     * INSERT & UPDATE
     */

    public static void insertCar(Car car) throws SQLException, JsonProcessingException {
        insertUpdateCar(car, true);
    }
    public static void updateCar(Car car) throws SQLException, JsonProcessingException {
        insertUpdateCar(car, false);
    }

    public static void insertUpdateCar(Car car, boolean insertingCar) throws SQLException, JsonProcessingException {
        final String checkSQL = "SELECT 1 FROM cars WHERE vin = ?";
        final String insertUpdateSQL;
        
        if (insertingCar) {
            insertUpdateSQL = "INSERT INTO cars " +
                    "(vin, make, model, model_year, description, num_cylinders, gears, horsepower, torque, seats, " +
                    " price_per_day, mpg, transmission, fuel, engine_layout, drivetrain, features, images, roof_type, vehicle_class, body_type)"
                    + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,? ,?)";
        } else { // updatingCar
            insertUpdateSQL = "UPDATE cars SET " +
                    "vin = ?, make = ?, model = ?, model_year = ?, description = ?, num_cylinders = ?, gears = ?, horsepower = ?, torque = ?, seats = ?, " +
                    "price_per_day = ?, mpg = ?, transmission = ?, fuel = ?, engine_layout = ?, drivetrain = ?, features = ?, images = ?, roof_type = ?, vehicle_class = ?, body_type = ?"
                    + " WHERE vin = ?";
        }

        try (PreparedStatement checkStmt = conn.prepareStatement(checkSQL);
             PreparedStatement insertUpdateStmt = conn.prepareStatement(insertUpdateSQL)) {

            // Check if VIN exists
            checkStmt.setString(1, car.getVin());
            ResultSet rs = checkStmt.executeQuery();
            boolean carInDB = rs.next();

            if (insertingCar && carInDB || !insertingCar && !carInDB) {
                if (insertingCar) throw new SQLException("Car already exists.");
                throw new SQLException("Car doesn't exist.");
            }

            // Bind parameters in the SAME order as the columns in insertSQL
            insertUpdateStmt.setString(1, car.getVin());
            insertUpdateStmt.setString(2, car.getMake());
            insertUpdateStmt.setString(3, car.getModel());
            insertUpdateStmt.setInt(4, car.getYear());
            insertUpdateStmt.setString(5, car.getDescription());
            insertUpdateStmt.setInt(6, car.getCylinders());
            insertUpdateStmt.setInt(7, car.getGears());
            insertUpdateStmt.setInt(8, car.getHorsepower());
            insertUpdateStmt.setInt(9, car.getTorque());
            insertUpdateStmt.setInt(10, car.getSeats());
            insertUpdateStmt.setDouble(11, car.getPricePerDay());
            insertUpdateStmt.setDouble(12, car.getMpg());
            // Stored as enum.toString()
            insertUpdateStmt.setString(13, car.getTransmission().toString());
            insertUpdateStmt.setString(14, car.getFuel().toString());
            insertUpdateStmt.setString(15, car.getEngineLayout().toString());
            insertUpdateStmt.setString(16, car.getDrivetrain().toString());
            insertUpdateStmt.setObject(17, toJsonArray(car.getFeatures()));
            insertUpdateStmt.setObject(18, toJsonArray(car.getImages()));
            insertUpdateStmt.setString(19, car.getRoofType().toString());
            insertUpdateStmt.setString(20, car.getVehicleClass().toString());
            insertUpdateStmt.setString(21, car.getBodyType().toString());

            // Set vin in WHERE clause - when updating
            if (!insertingCar) insertUpdateStmt.setString(22, car.getVin());

            // Execute SQL instruction
            int rows = insertUpdateStmt.executeUpdate();
            if (rows < 1) throw new SQLException("No database rows updated.");

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

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int DEFAULT_PAGE = 1;

    public static ArrayList<Car> getCarDB() throws ValidationException, SQLException, JsonProcessingException {
        return getCarDB(-1, -1, new String[0]);
    }

    public static ArrayList<Car> getCarDB(String[] columns) throws ValidationException, SQLException, JsonProcessingException {
        return getCarDB(-1, -1, columns);
    }

    public static ArrayList<Car> getCarDB(int page, int pageSize, String[] columns) throws ValidationException, SQLException, JsonProcessingException {
        if (page <= 0)
            page = DEFAULT_PAGE;
        if (pageSize <= -1)
            pageSize = DEFAULT_PAGE_SIZE;

        String selectCols = sanitizeColumns(columns);
        boolean paginate = pageSize != 0;
        String sql = "SELECT " + selectCols + " FROM cars" + (paginate ? " LIMIT ? OFFSET ?" : "");

        Set<String> colSet = (columns == null || columns.length == 0) ? null
                : new HashSet<>(Arrays.asList(columns));

        ArrayList<Car> cars = new ArrayList<>();
        int offset = (page - 1) * pageSize;

        PreparedStatement stmt = conn.prepareStatement(sql);
        if (paginate) {
            stmt.setInt(1, pageSize);
            stmt.setInt(2, offset);
        }
        ResultSet rs = stmt.executeQuery();
        while (rs.next()) {
            ArrayList<String> features = jsonToStringArrayList(rs.getString("features"));
            ArrayList<String> images = jsonToStringArrayList(rs.getString("images"));

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
                TransmissionType.valueOf(rs.getString("transmission")),
                Drivetrain.valueOf(rs.getString("drivetrain")),
                EngineLayout.valueOf(rs.getString("engine_layout")),
                FuelType.valueOf(rs.getString("fuel")),
                BodyType.valueOf(rs.getString("body_type")),
                RoofType.valueOf(rs.getString("roof_type")),
                VehicleClass.valueOf(rs.getString("vehicle_class"))
            ));
        }
        return cars;
    }

    // null colSet means all columns were requested
    private static boolean hasCol(java.util.Set<String> colSet, String col) {
        return colSet == null || colSet.contains(col);
    }

    public static Car getCarFromVin(String vin) throws ValidationException, SQLException, JsonProcessingException {
        final String sql = "SELECT vin, make, model, model_year, description, num_cylinders, gears, " +
                "horsepower, torque, seats, price_per_day, mpg, transmission, drivetrain, engine_layout, fuel, images, features,vehicle_class,body_type,roof_type "
                + "FROM cars WHERE vin = ?";

        PreparedStatement stmt = conn.prepareStatement(sql);
        stmt.setString(1, vin);
        ResultSet rs = stmt.executeQuery();

        while (rs.next()) {
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
                features, images,
                TransmissionType.valueOf(rs.getString("transmission")),
                Drivetrain.valueOf(rs.getString("drivetrain")),
                EngineLayout.valueOf(rs.getString("engine_layout")),
                FuelType.valueOf(rs.getString("fuel")),
                BodyType.valueOf(rs.getString("body_type")),
                RoofType.valueOf(rs.getString("roof_type")),
                VehicleClass.valueOf(rs.getString("vehicle_class"))
            );
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
