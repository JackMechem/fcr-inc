package com.inc.fcr;

import com.inc.fcr.car.Car;
import com.inc.fcr.car.CarController;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.reservation.ReservationController;
import com.inc.fcr.utils.APIController;
import com.inc.fcr.car.enums.EnumController;
import com.inc.fcr.utils.HibernateUtil;

import io.javalin.Javalin;

import static io.javalin.apibuilder.ApiBuilder.*;
import io.javalin.openapi.plugin.OpenApiPlugin;
import io.javalin.openapi.plugin.swagger.SwaggerPlugin;

public class Main {
    public static void main(String[] args) throws Exception {

        HibernateUtil.getSessionFactory();

        // Check for the "PORT" environment variable, default to 8080 if not found
        String portProperty = System.getenv("PORT");
        int port = (portProperty != null) ? Integer.parseInt(portProperty) : 8080;

        Javalin app = Javalin.create(config -> {
            // Automatically create documentation for API basses on annotations in code
            config.registerPlugin(new OpenApiPlugin(openApiConfig -> {
                openApiConfig.withRoles(Role.ANYONE);
                openApiConfig.withDefinitionConfiguration((version, definition) -> definition
                        .withInfo(info -> info
                                .title("FCR Inc API")
                                .description("Car rental API")
                        ).withSecurity(security -> security.withBasicAuth()));
            })

            );
            config.registerPlugin(new SwaggerPlugin(swaggerConfig -> {
                swaggerConfig.setUiPath("/docs");
                swaggerConfig.setDocumentationPath("/openapi");
                swaggerConfig.setRoles(new Role[] { Role.WRITE, Role.ADMIN });
            }));
            config.bundledPlugins.enableCors(cors -> {
                cors.addRule(it -> {
                    it.reflectClientOrigin = true;
                    it.allowCredentials = true;
                });
            });

            // Create controllers
            APIController cars = new APIController(Car.class, String.class);
            APIController reservations = new APIController(Reservation.class, Long.class);

            // Initialize endpoints
            config.router.mount(router -> {
                router.beforeMatched(Auth::handleAccess);
            }).apiBuilder(() -> {
                // Default redirect (/cars)
                get("/", ctx -> ctx.redirect("/cars"), Role.ANYONE);

                path("cars", () -> {
                    get(cars::getAll, Role.ANYONE);
                    post(cars::create, Role.WRITE);
                    path("{id}", () -> {
                        get(cars::getOne, Role.ANYONE);
                        patch(cars::update, Role.WRITE);
                        delete(cars::delete, Role.ADMIN);
                    });
                });

                path("reservations", () -> {
                    get(reservations::getAll, Role.ANYONE);
                    post(reservations::create, Role.WRITE);
                    path("{id}", () -> {
                        get(reservations::getOne, Role.ANYONE);
                        patch(reservations::update, Role.WRITE);
                        delete(reservations::delete, Role.ADMIN);
                    });
                });

                // redirect to enums (/enums) and (/enums{enum})
                path("enums", () -> { // /enums or enums?
                    get(EnumController::getAllEnums, Role.ANYONE);
                    path("{enum}", () -> {
                        get(EnumController::getEnum, Role.ANYONE);
                    });
                });
            });
        }).start(port);
    }
}
