package com.inc.fcr;

import com.inc.fcr.car.CarController;
import com.inc.fcr.utils.HibernateUtil;

import io.javalin.Javalin;


import static io.javalin.apibuilder.ApiBuilder.*;

public class Main {
    public static void main(String[] args) throws Exception {

        HibernateUtil.getSessionFactory();

        // Check for the "PORT" environment variable, default to 8080 if not found
        String portProperty = System.getenv("PORT");
        int port = (portProperty != null) ? Integer.parseInt(portProperty) : 8080;

        Javalin app = Javalin.create(config -> {
            config.bundledPlugins.enableCors(cors -> {
                cors.addRule(it -> {
                    it.reflectClientOrigin = true;
                    it.allowCredentials = true;
                });
            });
            config.router.mount(router -> {
                router.beforeMatched(Auth::handleAccess);
            }).apiBuilder(() -> {
                // Default redirect (/cars)
                get("/", ctx -> ctx.redirect("/cars"), Role.ANYONE);

                path("cars", () -> {
                    get(CarController::getAllCars, Role.ANYONE);
                    post(CarController::createCar, Role.WRITE);
                    path("{id}", () -> {
                        get(CarController::getCar, Role.ANYONE);
                        patch(CarController::updateCar, Role.WRITE);
                        delete(CarController::deleteCar, Role.ADMIN);
                    });
                });
            });
        }).start(port);
    }
}
