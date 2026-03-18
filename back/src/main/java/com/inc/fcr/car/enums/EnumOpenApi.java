package com.inc.fcr.car.enums;

// import com.inc.fcr.car.enums.*; -- not needed?
import com.inc.fcr.errorHandling.ApiErrorResponse;
import io.javalin.http.Context;
import io.javalin.openapi.*;

public class EnumOpenApi {
    @OpenApi(
        path = "/enums",
        methods = HttpMethod.GET,
        summary = "Get all enums",
        operationId = "getAllEnums",
        tags = {"enums"},
        queryParams = {
            /*@OpenApiParam(name = "page",         type = Integer.class, description = "Page number"),
            @OpenApiParam(name = "pageSize",      type = Integer.class, description = "Number of results per page"),
            @OpenApiParam(name = "select",        type = String.class,  description = "Comma separated fields to return e.g. vin,make,model"),
            @OpenApiParam(name = "sortBy",        type = String.class,  description = "Field to sort by e.g. pricePerDay"),
            @OpenApiParam(name = "sortDir",       type = String.class,  description = "Sort direction: asc or desc"),*/ // needed?
            @OpenApiParam(name = "transmission",  type = String.class,  description = "Filter by transmission type"),
            @OpenApiParam(name = "drivetrain",    type = String.class,  description = "Filter by drivetrain"),
            @OpenApiParam(name = "engineLayout",  type = String.class,  description = "Filter by engine layout"),
            @OpenApiParam(name = "fuel",          type = String.class,  description = "Filter by fuel type"),
            @OpenApiParam(name = "bodyType",      type = String.class,  description = "Filter by body type"),
            @OpenApiParam(name = "roofType",      type = String.class,  description = "Filter by roof type"),
            @OpenApiParam(name = "vehicleClass",  type = String.class,  description = "Filter by vehicle class")
            },
            responses = {
                    //@OpenApiResponse(status = "200", content = {@OpenApiContent(from = CarPagesWrapper.class)}), // ? from EnumController instead?
                    @OpenApiResponse(status = "400", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
                    @OpenApiResponse(status = "500", content = {@OpenApiContent(from = ApiErrorResponse.class)})
            }
    )
    public static void getAllEnums(Context ctx) {}

    @OpenApi(
        path = "/enums/{enum}",
        methods = HttpMethod.GET,
        summary = "Get an enum",
        operationId = "getEnum",
        tags = {"enums"},
        pathParams = {
            @OpenApiParam(name = "enum", type = String.class, description = "Enum Type") //??
        },
        queryParams = {
            @OpenApiParam(name = "select", type = String.class, description = "Comma separated fields to return e.g. vin,make,model") //???
        },
        responses = {
            // @OpenApiResponse(status = "200", content = {@OpenApiContent(from = Car.class)}), // ? from EnumController instead?
            @OpenApiResponse(status = "400", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "404", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "500", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
    public static void getEnum(Context ctx) {}
}
