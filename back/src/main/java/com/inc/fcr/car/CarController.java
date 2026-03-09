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
            String paramsQuery = ctx.queryParam("params");
            String pageQuery = ctx.queryParam("page");
            String pageSizeQuery = ctx.queryParam("pageSize");
            int pageNum = -1;
            int pageSizeNum = -1;
            try {
                pageNum = Integer.parseInt(pageQuery);
            } catch (NumberFormatException e) {
                System.out.println("Invalid number format: " + e.getMessage());
            }

            try {
                pageSizeNum = Integer.parseInt(pageSizeQuery);
            } catch (NumberFormatException e) {
                System.out.println("Invalid number format: " + e.getMessage());
            }

            String[] columns = (paramsQuery != null) ? paramsQuery.split(",") : null;
            ctx.json(DatabaseController.getCarDB(pageNum, pageSizeNum, columns));

        } catch (

        Exception e) {
            ctx.status(500).result("Database error: " + e);
        }
    }

    public static void createCar(Context ctx) {
        // TODO
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
