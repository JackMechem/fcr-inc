package com.inc.fcr.reservation;

import com.fasterxml.jackson.databind.JsonNode;
import com.inc.fcr.database.DatabaseController;
import com.inc.fcr.errorHandling.QueryParamException;
import com.inc.fcr.errorHandling.ValidationException;
import io.javalin.http.Context;
import org.hibernate.HibernateException;
import static com.inc.fcr.errorHandling.ApiErrors.*;

import java.time.Instant;

public class ReservationController {

    public static void getReservationsByUser(Context ctx) {
        try {
            long userId = Long.parseLong(ctx.pathParam("id"));
            ctx.json(ReservationDataController.getReservationsByUserId(userId));
        } catch (Exception e) {
            if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public static void getAllReservations(Context ctx) {
        try {
            ctx.json(ReservationDataController.getReservations());
        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public static void getReservation(Context ctx) {
        try {
            long id = Long.parseLong(ctx.pathParam("id"));
            Reservation res = ReservationDataController.getReservation(id);
            if (res == null) notFound(ctx);
            else ctx.json(res);
        } catch (Exception e) {
            if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }

    }

    public static void createReservation(Context ctx) {
        try {
            Reservation res = ctx.bodyAsClass(Reservation.class);
            ReservationDataController.insertReservation(res);
            ctx.status(201);
        } catch (Exception e) {
            if (e instanceof ValidationException) formatError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public static void updateReservation(Context ctx) {
        try {
            // Get reservation from database
            long id = Long.parseLong(ctx.pathParam("id"));
            Reservation res = ReservationDataController.getReservation(id);
            if (res == null) {
                notFound(ctx);
                return;
            }

            // Update specified fields allowed
            // TODO: how to handle cost updates from time changes (increases)?
            JsonNode body = ctx.bodyAsClass(JsonNode.class);
            if (body.has("car")) res.setCar(DatabaseController.getCarFromVin(body.get("car").asText()));
            if (body.has("pickUpTime") && body.has("dropOffTime")) {
                res.setTimeRange(Instant.parse(body.get("pickUpTime").asText()), Instant.parse(body.get("dropOffTime").asText()));
            } else {
                if (body.has("pickUpTime")) res.setPickUpTime(Instant.parse(body.get("pickUpTime").asText()));
                if (body.has("dropOffTime")) res.setDropOffTime(Instant.parse(body.get("dropOffTime").asText()));
            }

            ReservationDataController.updateReservation(res);
            ctx.status(201);

        } catch (Exception e) {
            if (e instanceof ValidationException) formatError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public static void deleteReservation(Context ctx) {
        try {
            long id = Long.parseLong(ctx.pathParam("id"));
            ReservationDataController.deleteReservation(id);
            ctx.status(204);
        } catch (Exception e) {
            if (e instanceof ValidationException) notFound(ctx);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }
}
