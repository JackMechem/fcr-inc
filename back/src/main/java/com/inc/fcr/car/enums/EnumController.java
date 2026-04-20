package com.inc.fcr.car.enums;

import com.inc.fcr.car.Car;
import com.inc.fcr.errorHandling.*;
import io.javalin.http.Context;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import static com.inc.fcr.errorHandling.ApiErrors.notFound;

/**
 * HTTP handler for the {@code /enums} endpoints.
 *
 * <p>Exposes all vehicle-related enum types (body type, drivetrain, etc.) as
 * JSON so clients can populate filter/dropdown UI without hard-coding values.</p>
 */
public class EnumController {

    /** Registry of all vehicle enum types exposed via the API. */
    private static final List<Class<? extends Enum<?>>> ENUMS = getEnumClasses();

    /** Generate list of all enum types used by the Car class. */
    private static List<Class<? extends Enum<?>>> getEnumClasses() {
        return Arrays.stream(Car.class.getDeclaredFields())
            .map(Field::getType).filter(Class::isEnum)
            .map(clazz -> (Class<? extends Enum<?>>) clazz)
            .distinct().collect(Collectors.toList());
    }

    /**
     * Returns the simple class name with its first character lowercased
     * (e.g., {@code "BodyType"} → {@code "bodyType"}) for use as a JSON map key.
     *
     * @param clazz the enum class
     * @return camelCase version of the class's simple name
     */
    private static String getCamelClassName(Class<?> clazz) {
        String name = clazz.getSimpleName();
        return Character.toLowerCase(name.charAt(0)) + name.substring(1);
    }

    /**
     * Returns the names of all constants in the given enum class as a string list.
     *
     * @param enuz the enum class to introspect
     * @return list of constant name strings (e.g., {@code ["SEDAN", "SUV", ...]})
     */
    private static List<String> getEnumConstantList(Class<? extends Enum<?>> enuz) {
        return Arrays.stream(enuz.getEnumConstants()).map(Enum::name).toList();
    }
    // --------------

    /**
     * Handles {@code GET /enums}.
     *
     * <p>Returns a JSON object mapping each enum type name (camelCase) to its
     * list of constant strings. Example:
     * {@code { "bodyType": ["SEDAN","SUV",...], "drivetrain": ["FWD","RWD","AWD"], ... }}</p>
     *
     * @param ctx the Javalin request context
     */
    public static void getAllEnums(Context ctx) {
        ctx.json(
                ENUMS.stream().collect(Collectors.toMap(
                        EnumController::getCamelClassName,
                        EnumController::getEnumConstantList
                ))
        );
    }

    /**
     * Handles {@code GET /enums/{enum}}.
     *
     * <p>Returns the list of constants for the named enum type (case-insensitive match).
     * Responds with 404 if the enum name is not recognized.</p>
     *
     * @param ctx the Javalin request context; {@code {enum}} path param is the enum class name
     */
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
