package com.inc.fcr.car;

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
    public static void getAllCars(Context ctx) {}

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
    public static void getCar(Context ctx) {}

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
    public static void createCar(Context ctx) {}

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
    public static void updateCar(Context ctx) {}

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
    public static void deleteCar(Context ctx) {}
}
