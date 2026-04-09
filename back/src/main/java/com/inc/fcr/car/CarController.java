package com.inc.fcr.car;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.errorHandling.*;
import static com.inc.fcr.errorHandling.ApiErrors.*;
import com.inc.fcr.car.enums.*;
import io.javalin.http.Context;
import io.javalin.openapi.*;

import com.inc.fcr.database.DatabaseController;
import com.inc.fcr.database.ParsedQueryParams;

import org.hibernate.HibernateException;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class CarController extends CarOpenApi {

    public static void getAllCars(Context ctx) {
        try {
            ParsedQueryParams parsedQueryParams = new ParsedQueryParams(Car.class, ctx.queryParamMap());
            ctx.json(DatabaseController.getCars(parsedQueryParams));
        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public static void getCar(Context ctx) {
        try {
            String vin = ctx.pathParam("id");
            ParsedQueryParams parsedQueryParams = new ParsedQueryParams(Car.class, ctx.queryParamMap());
            boolean select = parsedQueryParams.getSelectFields() != null && !parsedQueryParams.getSelectFields().isEmpty();

            Object car;
            if (select) car = DatabaseController.getCarFromVinSelect(vin, parsedQueryParams);
            else car = DatabaseController.getCarFromVin(vin);

            if (car == null) notFound(ctx);
            else ctx.json(car);

        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
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
            if (e instanceof ValidationException) formatError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public static void updateCar(Context ctx) {
        try {
            // Get car from database
            Car car = DatabaseController.getCarFromVin(ctx.pathParam("id"));
            if (car == null) {
                notFound(ctx);
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
            if (e instanceof ValidationException) formatError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }

    }

    public static void deleteCar(Context ctx) {
        try {
            DatabaseController.deleteCar(ctx.pathParam("id"));
            ctx.status(204);
        } catch (Exception e) {
            if (e instanceof ValidationException) notFound(ctx);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }
}
