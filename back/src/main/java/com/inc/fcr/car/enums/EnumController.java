package com.inc.fcr.car.enums;

import com.inc.fcr.errorHandling.*;
import io.javalin.http.Context;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static com.inc.fcr.errorHandling.ApiErrors.notFound;

public class EnumController {

    // Enum list
    private static final List<Class<? extends Enum<?>>> ENUMS = List.of(
        BodyType.class,
        Drivetrain.class,
        EngineLayout.class,
        FuelType.class,
        RoofType.class,
        TransmissionType.class,
        VehicleClass.class
    );
    // Enum helpers
    private static String getCamelClassName(Class<?> clazz) {
        String name = clazz.getSimpleName();
        return Character.toLowerCase(name.charAt(0)) + name.substring(1);
    }

    private static List<String> getEnumConstantList(Class<? extends Enum<?>> enuz) {
        return Arrays.stream(enuz.getEnumConstants()).map(Enum::name).toList();
    }
    // --------------

    public static void getAllEnums(Context ctx) {
        ctx.json(
                ENUMS.stream().collect(Collectors.toMap(
                        EnumController::getCamelClassName,
                        EnumController::getEnumConstantList
                ))
        );
    }

    public static void getEnum(Context ctx) {
        String select = ctx.pathParam("enum").trim();
        for (var enuz : ENUMS) {
            if (select.equalsIgnoreCase(enuz.getSimpleName())) {
                ctx.json(getEnumConstantList(enuz));
                return;
            }
        }
        notFound(ctx);
    }
}
