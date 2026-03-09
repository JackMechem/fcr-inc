package com.inc.fcr.car;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;
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
            DatabaseController database = new DatabaseController();
            ArrayList<Car> cars = database.getCarDB();
            ctx.json(cars);
        } catch (SQLException e) {
            throw new RuntimeException("Database error", e);
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
