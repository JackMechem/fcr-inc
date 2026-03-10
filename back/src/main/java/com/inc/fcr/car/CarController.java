package com.inc.fcr.car;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.inc.fcr.Role;
import com.inc.fcr.ValidationException;
import com.inc.fcr.car.enums.*;
import io.javalin.Javalin;
import io.javalin.http.Context;

import com.inc.fcr.database.DatabaseController;
import com.inc.fcr.car.Car;

import java.sql.*;
import java.util.ArrayList;

import java.io.IOException;
import java.util.stream.StreamSupport;

public class CarController {
    public static void getAllCars(Context ctx) {
        try {
            int pageNum = ctx.queryParamAsClass("page", int.class).getOrDefault(-1);
            int pageSizeNum = ctx.queryParamAsClass("pageSize", int.class).getOrDefault(-1);
            String paramsQuery = ctx.queryParamAsClass("params", String.class).getOrDefault("");

            String[] columns = paramsQuery.split(",");
            ctx.json(DatabaseController.getCarDB(pageNum, pageSizeNum, columns));

        } catch (Exception e) {
            databaseError(ctx, e);
        }
    }

    public static void createCar(Context ctx) {
        JsonNode body = ctx.bodyAsClass(JsonNode.class);
        try {
            ObjectMapper mapper = new ObjectMapper();
            ArrayList<String> features = mapper.convertValue(body.get("features"), new TypeReference<ArrayList<String>>() {});
            ArrayList<String> images = mapper.convertValue(body.get("images"), new TypeReference<ArrayList<String>>() {});
            // TODO: add some default values if not found here
            Car car = new Car(
                    body.get("vin").asText(),
                    body.get("make").asText(),
                    body.get("model").asText(),
                    body.get("modelYear").asInt(),
                    body.get("description").asText(),
                    body.get("cylinders").asInt(),
                    body.get("gears").asInt(),
                    body.get("horsepower").asInt(),
                    body.get("torque").asInt(),
                    body.get("seats").asInt(),
                    body.get("pricePerDay").asDouble(),
                    body.get("mpg").asDouble(),
                    features,
                    images,
                    TransmissionType.valueOf(body.get("transmission").asText()),
                    Drivetrain.valueOf(body.get("driveTrain").asText()),
                    EngineLayout.valueOf(body.get("engineLayout").asText()),
                    FuelType.valueOf(body.get("fuel").asText()),
                    BodyType.valueOf(body.get("bodyType").asText()),
                    RoofType.valueOf(body.get("roofType").asText()),
                    VehicleClass.valueOf(body.get("vehicleClass").asText())
            );
            DatabaseController.insertCar(car);
            ctx.status(201);

        } catch (Exception e) {
            if (e instanceof SQLException) {
                databaseError(ctx, e);
            } else {
                ctx.status(400).result("Improper car format: " + e);
            }
        }
    }

    public static void getCar(Context ctx) {
        Car car = null;
        try {
            car = DatabaseController.getCarFromVin(ctx.pathParam("id"));
        } catch (Exception e) {
            databaseError(ctx, e);
        }

        if (car != null) {ctx.json(car);}
        else {carNotFound(ctx);}
    }

    public static void updateCar(Context ctx) {
        // TODO
        // uses: ctx.bodyAsClass(AnyClassHere.class)
    }

    public static void deleteCar(Context ctx) {
        try {
            DatabaseController.deleteCar(ctx.pathParam("id"));
            ctx.status(204);
        } catch (SQLException e) {
            carNotFound(ctx);
        }
    }

    // Helper methods
    private static void carNotFound(Context ctx) {
        ctx.status(404).result("Car not found.");
    }
    private static void databaseError(Context ctx, Exception e) {
        ctx.status(500).result("Database error: " + e);
    }
}
