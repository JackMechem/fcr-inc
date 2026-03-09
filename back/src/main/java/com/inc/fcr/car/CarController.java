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
            throw new SQLException("test");
//            ctx.json(new DatabaseController().getCarDB());
        } catch (SQLException e) {
            ctx.status(500).result("Database error: "+e);
        }
    }
    public static void createCar(Context ctx) {
        // TODO
        // uses: ctx.bodyAsClass(AnyClassHere.class)
    }
    public static void getCar(Context ctx) {
        try {
            DatabaseController database = new DatabaseController();
            String vinOut = ctx.pathParam("id");
            Car car = database.getCarFromVin(vinOut);
            ctx.json(car);
        } catch (SQLException e) {
            throw new RuntimeException("Database error", e);
        }
    }
    public static void updateCar(Context ctx) {
        // TODO
        // uses: ctx.bodyAsClass(AnyClassHere.class)
    }
    public static void deleteCar(Context ctx) {
        // TODO
    }

}
