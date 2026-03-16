package com.inc.fcr.car;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.errorHandling.*;
import com.inc.fcr.car.enums.*;
import io.javalin.http.Context;
import io.javalin.http.Context;
import io.javalin.openapi.*;

import com.inc.fcr.database.DatabaseController;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.sql.*;
import java.util.ArrayList;
import java.util.Map;

public class CarController {

    @OpenApi(
        path = "/cars",
        methods = HttpMethod.GET,
        summary = "Get all cars",
        operationId = "getAllCars",
        tags = {"Cars"},
        queryParams = {
            @OpenApiParam(name = "page",         type = Integer.class, description = "Page number"),
            @OpenApiParam(name = "pageSize",      type = Integer.class, description = "Number of results per page"),
            @OpenApiParam(name = "select",        type = String.class,  description = "Comma separated fields to return e.g. vin,make,model"),
            @OpenApiParam(name = "sortBy",        type = String.class,  description = "Field to sort by e.g. pricePerDay"),
            @OpenApiParam(name = "sortDir",       type = String.class,  description = "Sort direction: asc or desc"),
            @OpenApiParam(name = "transmission",  type = String.class,  description = "Filter by transmission type"),
            @OpenApiParam(name = "drivetrain",    type = String.class,  description = "Filter by drivetrain"),
            @OpenApiParam(name = "engineLayout",  type = String.class,  description = "Filter by engine layout"),
            @OpenApiParam(name = "fuel",          type = String.class,  description = "Filter by fuel type"),
            @OpenApiParam(name = "bodyType",      type = String.class,  description = "Filter by body type"),
            @OpenApiParam(name = "roofType",      type = String.class,  description = "Filter by roof type"),
            @OpenApiParam(name = "vehicleClass",  type = String.class,  description = "Filter by vehicle class")
        },
        responses = {
            @OpenApiResponse(status = "200", content = {@OpenApiContent(from = CarPagesWrapper.class)}),
            @OpenApiResponse(status = "400", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "500", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
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

            if (select != null) {
                ctx.json(DatabaseController.getCarsFilteredSelect(pageNum, pageSizeNum,
                        transmission, drivetrain, engineLayout, fuel, bodyType, roofType, vehicleClass,
                        select, sortBy, sortDir));
            } else {
                ctx.json(DatabaseController.getCarsFiltered(pageNum, pageSizeNum,
                        transmission, drivetrain, engineLayout, fuel, bodyType, roofType, vehicleClass,
                        sortBy, sortDir));
            }

        } catch (Exception e) {
            if (e instanceof QueryParamValidationException) {
                queryParamValidationError(ctx, e);
            } else {
                databaseError(ctx, e);
            }
        }
    }

    @OpenApi(
        path = "/cars/{id}",
        methods = HttpMethod.GET,
        summary = "Get car by VIN",
        operationId = "getCar",
        tags = {"Cars"},
        pathParams = {
            @OpenApiParam(name = "id", type = String.class, description = "Vehicle VIN")
        },
        queryParams = {
            @OpenApiParam(name = "select", type = String.class, description = "Comma separated fields to return e.g. vin,make,model")
        },
        responses = {
            @OpenApiResponse(status = "200", content = {@OpenApiContent(from = Car.class)}),
            @OpenApiResponse(status = "400", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "404", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "500", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
    public static void getCar(Context ctx) {
        try {
            String vin = ctx.pathParam("id");
            String selectParam = ctx.queryParam("select");
            String[] select = (selectParam != null) ? selectParam.split(",") : null;

            if (select != null) {
                Map<String, Object> car = DatabaseController.getCarFromVinSelect(vin, select);
                if (car == null)
                    carNotFound(ctx);
                else
                    ctx.json(car);
            } else {
                Car car = DatabaseController.getCarFromVin(vin);
                if (car == null)
                    carNotFound(ctx);
                else
                    ctx.json(car);
            }

        } catch (Exception e) {
            if (e instanceof QueryParamValidationException) {
                queryParamValidationError(ctx, e);
            } else {
                databaseError(ctx, e);
            }
        }
    }

    private static String upperOrNull(Context ctx, String param) {
        String val = ctx.queryParam(param);
        return val != null ? val.toUpperCase() : null;
    }

    @OpenApi(
        path = "/cars",
        methods = HttpMethod.POST,
        summary = "Create a new car",
        operationId = "createCar",
        tags = {"Cars"},
        requestBody = @OpenApiRequestBody(
            required = true,
            content = {@OpenApiContent(from = Car.class)}
        ),
        responses = {
            @OpenApiResponse(status = "201", description = "Car created successfully"),
            @OpenApiResponse(status = "400", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "500", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
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
            if (e instanceof SQLException) {
                databaseError(ctx, e);
            } else {
                validationError(ctx, e);
            }
        }
    }

    @OpenApi(
        path = "/cars/{id}",
        methods = HttpMethod.PATCH,
        summary = "Update a car by VIN",
        operationId = "updateCar",
        tags = {"Cars"},
        pathParams = {
            @OpenApiParam(name = "id", type = String.class, description = "Vehicle VIN")
        },
        requestBody = @OpenApiRequestBody(
            required = true,
            description = "Fields to update — only include fields you want to change",
            content = {@OpenApiContent(from = Car.class)}
        ),
        responses = {
            @OpenApiResponse(status = "201", description = "Car updated successfully"),
            @OpenApiResponse(status = "400", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "404", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "500", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
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
            if (e instanceof SQLException) {
                databaseError(ctx, e);
            } else if (e instanceof ValidationException) {
                validationError(ctx, e);
            } else {
                ctx.status(500).result("Server error: " + e);
            }
        }

    }

    @OpenApi(
        path = "/cars/{id}",
        methods = HttpMethod.DELETE,
        summary = "Delete a car by VIN",
        operationId = "deleteCar",
        tags = {"Cars"},
        pathParams = {
            @OpenApiParam(name = "id", type = String.class, description = "Vehicle VIN")
        },
        responses = {
            @OpenApiResponse(status = "204", description = "Car deleted successfully"),
            @OpenApiResponse(status = "404", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
    public static void deleteCar(Context ctx) {
        try {
            DatabaseController.deleteCar(ctx.pathParam("id"));
            ctx.status(204);
        } catch (RuntimeException e) {
            carNotFound(ctx);
        }
    }

    // Helper methods
    private static void carNotFound(Context ctx) {
        ctx.status(404).json(new ApiErrorResponse(404, "Car Not Found", null, null));
    }

    private static void databaseError(Context ctx, Exception e) {
        ctx.status(500).json(new ApiErrorResponse(500, "Database Error", ""+e, stackTraceString(e)));
    }

    private static void validationError(Context ctx, Exception e) {
        ctx.status(400).json(new ApiErrorResponse(400, "Improper Car Format", ""+e, stackTraceString(e)));
    }

    private static void queryParamValidationError(Context ctx, Exception e) {
        ctx.status(400).json(new ApiErrorResponse(400, "Invalid Query Parameters", ""+e, stackTraceString(e)));
    }

    private static String stackTraceString(Exception e) {
        StringWriter stack = new StringWriter();
        e.printStackTrace(new PrintWriter(stack));
        return stack.toString();
    }
}
