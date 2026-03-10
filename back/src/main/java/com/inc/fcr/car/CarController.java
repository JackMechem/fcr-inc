package com.inc.fcr.car;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.inc.fcr.Role;
import io.javalin.Javalin;
import io.javalin.http.Context;

import com.inc.fcr.database.DatabaseController;
import com.inc.fcr.car.Car;

import java.sql.*;
import java.util.ArrayList;

import java.io.IOException;
import java.util.stream.StreamSupport;

public class CarController {
    public static void getAllCars(Context ctx) {
        try {
            int pageNum = ctx.queryParamAsClass("page", int.class).getOrDefault(-1);
            int pageSizeNum = ctx.queryParamAsClass("pageSize", int.class).getOrDefault(-1);
            String paramsQuery = ctx.queryParamAsClass("params", String.class).getOrDefault("");

            String[] columns = paramsQuery.split(",");
            ctx.json(DatabaseController.getCarDB(pageNum, pageSizeNum, columns));

        } catch (Exception e) {
            ctx.status(500).result("Database error: " + e);
        }
    }

    public static void createCar(Context ctx) {
        // TODO
//        ctx.bodyAsClass(Car.class)
        // uses: ctx.bodyAsClass(AnyClassHere.class)
    }

    public static void getCar(Context ctx) {
        Car car = DatabaseController.getCarFromVin(ctx.pathParam("id"));
        if (car != null) {
            ctx.json(car);
        } else {
            carNotFound(ctx);
        }
    }

    public static void updateCar(Context ctx) {
        // TODO
        // uses: ctx.bodyAsClass(AnyClassHere.class)
    }

    public static void deleteCar(Context ctx) {
        boolean successfullyDeleted = DatabaseController.deleteCar(ctx.pathParam("id"));
        if (successfullyDeleted) {
            ctx.status(204);
        } else {
            carNotFound(ctx);
        }
    }

    // Helper methods
    private static void carNotFound(Context ctx) {
        ctx.status(404).result("Car not found.");
    }
}
