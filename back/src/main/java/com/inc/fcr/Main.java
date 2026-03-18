package com.inc.fcr;

import com.inc.fcr.car.CarController;
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
