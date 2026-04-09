package com.inc.fcr.car;

import com.inc.fcr.database.PagesWrapper;
import com.inc.fcr.errorHandling.ApiErrorResponse;
import io.javalin.http.Context;
import io.javalin.openapi.*;

public class CarOpenApi {

    @OpenApi(
            path = "/cars",
            methods = HttpMethod.GET,
            summary = "Get all cars",
            operationId = "getAllCars",
            tags = {"Cars"},
            queryParams = {
                    @OpenApiParam(name = "page", type = Integer.class, description = "Page number"),
                    @OpenApiParam(name = "pageSize", type = Integer.class, description = "Number of results per page"),

                    @OpenApiParam(name = "select", type = String.class, description = "Comma separated fields to return e.g. vin,make,model"),
                    @OpenApiParam(name = "sortBy", type = String.class, description = "Field to sort by e.g. pricePerDay"),
                    @OpenApiParam(name = "sortDir", type = String.class, description = "Sort direction: asc or desc"),

                    @OpenApiParam(name = "q", type = String.class, description = "Generic search across make, model, description"),
                    @OpenApiParam(name = "make", type = String.class, description = "Partial match on make"),
                    @OpenApiParam(name = "model", type = String.class, description = "Partial match on model"),
                    @OpenApiParam(name = "description", type = String.class, description = "Partial match on description"),

                    @OpenApiParam(name = "modelYear", type = Integer.class, description = "Exact match on model year"),
                    @OpenApiParam(name = "minModelYear", type = Integer.class, description = "Minimum model year"),
                    @OpenApiParam(name = "maxModelYear", type = Integer.class, description = "Maximum model year"),

                    @OpenApiParam(name = "minPricePerDay", type = Double.class, description = "Minimum price per day"),
                    @OpenApiParam(name = "maxPricePerDay", type = Double.class, description = "Maximum price per day"),

                    @OpenApiParam(name = "minHorsepower", type = Integer.class, description = "Minimum horsepower"),
                    @OpenApiParam(name = "maxHorsepower", type = Integer.class, description = "Maximum horsepower"),

                    @OpenApiParam(name = "minSeats", type = Integer.class, description = "Minimum seats"),
                    @OpenApiParam(name = "maxSeats", type = Integer.class, description = "Maximum seats"),

                    @OpenApiParam(name = "minMpg", type = Double.class, description = "Minimum MPG"),
                    @OpenApiParam(name = "maxMpg", type = Double.class, description = "Maximum MPG"),

                    @OpenApiParam(name = "transmission", type = String.class, description = "Filter by transmission type"),
                    @OpenApiParam(name = "drivetrain", type = String.class, description = "Filter by drivetrain"),
                    @OpenApiParam(name = "engineLayout", type = String.class, description = "Filter by engine layout"),
                    @OpenApiParam(name = "fuel", type = String.class, description = "Filter by fuel type"),
                    @OpenApiParam(name = "bodyType", type = String.class, description = "Filter by body type"),
                    @OpenApiParam(name = "roofType", type = String.class, description = "Filter by roof type"),
                    @OpenApiParam(name = "vehicleClass", type = String.class, description = "Filter by vehicle class")
            },
            responses = {
                    @OpenApiResponse(status = "200", content = {@OpenApiContent(from = PagesWrapper.class)}),
                    @OpenApiResponse(status = "400", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
                    @OpenApiResponse(status = "500", content = {@OpenApiContent(from = ApiErrorResponse.class)})
            }
    )
    public static void getAllCars(Context ctx) {
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
    }
}