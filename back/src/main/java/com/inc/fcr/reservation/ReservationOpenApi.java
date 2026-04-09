package com.inc.fcr.reservation;

import com.inc.fcr.database.PagesWrapper;
import com.inc.fcr.errorHandling.ApiErrorResponse;
import io.javalin.http.Context;
import io.javalin.openapi.*;

public class ReservationOpenApi {

    @OpenApi(
        path = "/reservations",
        methods = HttpMethod.GET,
        summary = "Get all reservations",
        operationId = "getAllReservations",
        tags = {"Reservations"},
        queryParams = {
            @OpenApiParam(name = "page",         type = Integer.class, description = "Page number"),
            @OpenApiParam(name = "pageSize",      type = Integer.class, description = "Number of results per page"),
        },
        responses = {
            @OpenApiResponse(status = "200", content = {@OpenApiContent(from = PagesWrapper.class)}),
            @OpenApiResponse(status = "400", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "500", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
    public static void getAllReservations(Context ctx) {}

    @OpenApi(
        path = "/reservations/{id}",
        methods = HttpMethod.GET,
        summary = "Get reservation by ID",
        operationId = "getReservation",
        tags = {"Reservations"},
        pathParams = {
            @OpenApiParam(name = "id", type = String.class, description = "Reservation ID")
        },
        queryParams = {},
        responses = {
            @OpenApiResponse(status = "200", content = {@OpenApiContent(from = Reservation.class)}),
            @OpenApiResponse(status = "400", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "404", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "500", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
    public static void getReservation(Context ctx) {}

    @OpenApi(
        path = "/reservations",
        methods = HttpMethod.POST,
        summary = "Create a new reservation",
        operationId = "createReservation",
        tags = {"Reservations"},
        requestBody = @OpenApiRequestBody(
            required = true,
            content = {@OpenApiContent(from = Reservation.class)}
        ),
        responses = {
            @OpenApiResponse(status = "201", description = "Reservation created successfully"),
            @OpenApiResponse(status = "400", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "500", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
    public static void createReservation(Context ctx) {}

    @OpenApi(
        path = "/reservations/{id}",
        methods = HttpMethod.PATCH,
        summary = "Update a reservation by ID",
        operationId = "updateReservation",
        tags = {"Reservations"},
        pathParams = {
            @OpenApiParam(name = "id", type = String.class, description = "Reservation ID")
        },
        requestBody = @OpenApiRequestBody(
            required = true,
            description = "Fields to update — only include fields you want to change\nTime changes may create new invoices.",
            content = {@OpenApiContent(from = Reservation.class)}
        ),
        responses = {
            @OpenApiResponse(status = "201", description = "Reservation updated successfully"),
            @OpenApiResponse(status = "400", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "404", content = {@OpenApiContent(from = ApiErrorResponse.class)}),
            @OpenApiResponse(status = "500", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
    public static void updateReservation(Context ctx) {}

    @OpenApi(
        path = "/reservations/{id}",
        methods = HttpMethod.DELETE,
        summary = "Delete a reservation by ID",
        operationId = "deleteReservation",
        tags = {"Reservations"},
        pathParams = {
            @OpenApiParam(name = "id", type = String.class, description = "Reservation ID")
        },
        responses = {
            @OpenApiResponse(status = "204", description = "Reservation deleted successfully"),
            @OpenApiResponse(status = "404", content = {@OpenApiContent(from = ApiErrorResponse.class)})
        }
    )
    public static void deleteReservation(Context ctx) {}
}
