package com.inc.fcr.car;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.errorHandling.*;
import com.inc.fcr.car.enums.*;
import io.javalin.http.Context;
import io.javalin.openapi.*;

import com.inc.fcr.database.DatabaseController;
import org.hibernate.HibernateException;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.sql.*;
import java.util.ArrayList;
import java.util.Map;

public class CarController extends CarOpenApi {

    public static void getAllCars(Context ctx) {
        try {
            int pageNum = ctx.queryParamAsClass("page", int.class).getOrDefault(-1);
            int pageSizeNum = ctx.queryParamAsClass("pageSize", int.class).getOrDefault(-1);
            String sortBy = ctx.queryParam("sortBy");
            String sortDir = ctx.queryParam("sortDir");

            String selectParam = ctx.queryParam("select");
            String[] select = (selectParam != null) ? selectParam.split(",") : null;

            String transmission = upperOrNull(ctx, "transmission");
            String drivetrain = upperOrNull(ctx, "drivetrain");
            String engineLayout = upperOrNull(ctx, "engineLayout");
            String fuel = upperOrNull(ctx, "fuel");
            String bodyType = upperOrNull(ctx, "bodyType");
            String roofType = upperOrNull(ctx, "roofType");
            String vehicleClass = upperOrNull(ctx, "vehicleClass");

            ctx.json(DatabaseController.getCarsFilteredSelect(pageNum, pageSizeNum, transmission, drivetrain,
                    engineLayout, fuel, bodyType, roofType, vehicleClass, select, sortBy, sortDir));

        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public static void getCar(Context ctx) {
        try {
            String vin = ctx.pathParam("id");
            String selectParam = ctx.queryParam("select");
            String[] select = (selectParam != null) ? selectParam.split(",") : null;

            Object car;
            if (select != null) car = DatabaseController.getCarFromVinSelect(vin, select);
            else car = DatabaseController.getCarFromVin(vin);

            if (car == null) carNotFound(ctx);
            else ctx.json(car);

        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else databaseError(ctx, e);
        }
    }

    public static void createCar(Context ctx) {
        JsonNode body = ctx.bodyAsClass(JsonNode.class);
        try {
            ObjectMapper mapper = new ObjectMapper();
            ArrayList<String> features = mapper.convertValue(body.get("features"),
                    new TypeReference<ArrayList<String>>() {
                    });
            ArrayList<String> images = mapper.convertValue(body.get("images"), new TypeReference<ArrayList<String>>() {
            });
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
                    Drivetrain.valueOf(body.get("drivetrain").asText()),
                    EngineLayout.valueOf(body.get("engineLayout").asText()),
                    FuelType.valueOf(body.get("fuel").asText()),
                    BodyType.valueOf(body.get("bodyType").asText()),
                    RoofType.valueOf(body.get("roofType").asText()),
                    VehicleClass.valueOf(body.get("vehicleClass").asText()));
            DatabaseController.insertCar(car);
            ctx.status(201);

        } catch (Exception e) {
            if (e instanceof ValidationException) validationError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public static void updateCar(Context ctx) {
        try {
            // Get car from database
            Car car = DatabaseController.getCarFromVin(ctx.pathParam("id"));
            if (car == null) {
                carNotFound(ctx);
                return;
            }

            // Update specified fields
            var fields = ctx.bodyAsClass(JsonNode.class).fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                Car.setterKeyMap.get(entry.getKey()).accept(car, entry.getValue());
            }

            DatabaseController.updateCar(car);
            ctx.status(201);

        } catch (Exception e) {
            if (e instanceof ValidationException) validationError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }

    }

    public static void deleteCar(Context ctx) {
        try {
            DatabaseController.deleteCar(ctx.pathParam("id"));
            ctx.status(204);
        } catch (Exception e) {
            if (e instanceof ValidationException) carNotFound(ctx);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    // Helper methods
    private static void carNotFound(Context ctx) {
        ctx.status(404).json(new ApiErrorResponse(404, "Car Not Found", null, null));
    }

    private static void validationError(Context ctx, Exception e) {
        ctx.status(400).json(new ApiErrorResponse(400, "Improper Car Format", ""+e, stackTraceString(e)));
    }

    private static void queryParamError(Context ctx, Exception e) {
        ctx.status(400).json(new ApiErrorResponse(400, "Invalid Query Parameters", ""+e, stackTraceString(e)));
    }

    private static void databaseError(Context ctx, Exception e) {
        ctx.status(500).json(new ApiErrorResponse(500, "Database Error", ""+e, stackTraceString(e)));
    }

    private static void serverError(Context ctx, Exception e) {
        ctx.status(500).json(new ApiErrorResponse(500, "Server Error", ""+e, stackTraceString(e)));
    }

    private static String stackTraceString(Exception e) {
        StringWriter stack = new StringWriter();
        e.printStackTrace(new PrintWriter(stack));
        return stack.toString();
    }

    private static String upperOrNull(Context ctx, String param) {
        String val = ctx.queryParam(param);
        return val != null ? val.toUpperCase() : null;
    }
}
