package com.inc.fcr.car.enums;

import com.inc.fcr.errorHandling.ApiErrorResponse;
import io.javalin.http.Context;
import io.javalin.openapi.*;

public class EnumOpenApi {
    @OpenApi(
        path = "/enums",
        methods = HttpMethod.GET,
        summary = "Get all enums",
        operationId = "getAllEnums",
        tags = {"Enums"},
        responses = {
                @OpenApiResponse(status = "200", content = {@OpenApiContent(from = EnumController.class)})
        }
    )
    public static void getAllEnums(Context ctx) {}

    @OpenApi(
        path = "/enums/{enum}",
        methods = HttpMethod.GET,
        summary = "Get an enum",
        operationId = "getEnum",
        tags = {"Enums"},
        pathParams = {
            @OpenApiParam(name = "enum", type = String.class, description = "Enum Type (case insensitive)")
        },
        responses = {
            @OpenApiResponse(status = "200", content = {@OpenApiContent(from = EnumController.class)}),
            @OpenApiResponse(status = "404", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
    public static void getEnum(Context ctx) {}
}
