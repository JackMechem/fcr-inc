package com.inc.fcr.car.enums;

// some of these are needed and some not!!!
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.errorHandling.*;
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

public class EnumController {

    //FIXING
    public static void getAllEnums(Context ctx) {

        // do something with this?
        /*try {
            ParsedQueryParams parsedQueryParams = new ParsedQueryParams(ctx.queryParamMap());
            ctx.json(DatabaseController.getCars(parsedQueryParams));
        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }*/

        //THIS
        /*"fuelType":[GASOLINE, DIESEL, ELECTRIC, HYBRID],
        "BodyType":[SEDAN, SUV, TRUCK, CONVERTIBLE, HATCHBACK, FULL_SIZE, COMPACT, WAGON, ELECTRIC, COUPE],
        "Drivetrain":[FWD, RWD, AWD],
        "EngineLayout":[V,INLINE,FLAT,SINGLE_MOTOR,DUAL_MOTOR],
        "RoofType":[SOFTTOP, HARDTOP, TARGA, SLICKTOP, SUNROOF, PANORAMIC],
        "TransmissionType":[AUTOMATIC, MANUAL],
        "VehicleClass":[ECONOMY, LUXURY, PERFORMANCE, OFFROAD, FULL_SIZE, ELECTRIC]
        */

    }

    //FIXING
    public static void getEnum(Context ctx) {

        // do something with this
        /*try {
            String vin = ctx.pathParam("id");
            ParsedQueryParams parsedQueryParams = new ParsedQueryParams(ctx.queryParamMap());
            String[] select = parsedQueryParams.getSelectFields() != null ? parsedQueryParams.getSelectFields().toArray(new String[parsedQueryParams.getSelectFields().size()]) : null;

            Object car;
            if (select != null) car = DatabaseController.getCarFromVinSelect(vin, parsedQueryParams);
            else car = DatabaseController.getCarFromVin(vin);

            if (enum == null) enumNotFound(ctx);
            else ctx.json(enum);

        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }*/

        //THIS -- here enter param and get back one
        /*"fuelType":[GASOLINE, DIESEL, ELECTRIC, HYBRID],
        "BodyType":[SEDAN, SUV, TRUCK, CONVERTIBLE, HATCHBACK, FULL_SIZE, COMPACT, WAGON, ELECTRIC, COUPE],
        "Drivetrain":[FWD, RWD, AWD],
        "EngineLayout":[V,INLINE,FLAT,SINGLE_MOTOR,DUAL_MOTOR],
        "RoofType":[SOFTTOP, HARDTOP, TARGA, SLICKTOP, SUNROOF, PANORAMIC],
        "TransmissionType":[AUTOMATIC, MANUAL],
        "VehicleClass":[ECONOMY, LUXURY, PERFORMANCE, OFFROAD, FULL_SIZE, ELECTRIC]
        */


    }



    // Helper methods
    private static void enumNotFound(Context ctx) {
        ctx.status(404).json(new ApiErrorResponse(404, "Enum Not Found", null, null));
    }

    // maybe not needed?
    /*private static void validationError(Context ctx, Exception e) {
        ctx.status(400).json(new ApiErrorResponse(400, "Improper Enum Format", "" + e, stackTraceString(e)));
    }

    private static void queryParamError(Context ctx, Exception e) {
        ctx.status(400).json(new ApiErrorResponse(400, "Invalid Query Parameters", "" + e, stackTraceString(e)));
    }

    private static void databaseError(Context ctx, Exception e) {
        ctx.status(500).json(new ApiErrorResponse(500, "Database Error", "" + e, stackTraceString(e)));
    }*/

    private static void serverError(Context ctx, Exception e) {
        ctx.status(500).json(new ApiErrorResponse(500, "Server Error", "" + e, stackTraceString(e)));
    }

    private static String stackTraceString(Exception e) {
        StringWriter stack = new StringWriter();
        e.printStackTrace(new PrintWriter(stack));
        return stack.toString();
    }

}
