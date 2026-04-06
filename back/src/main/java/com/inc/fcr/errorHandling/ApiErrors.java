package com.inc.fcr.errorHandling;

import io.javalin.http.Context;
import io.javalin.openapi.*;

import java.io.PrintWriter;
import java.io.StringWriter;

import com.inc.fcr.car.enums.*;

public final class ApiErrors {

    private static void reDirectError(Context ctx, String newLocation) { // 302
        ctx.status(302).header("Location", newLocation);
    }

    private static void formatError(Context ctx, Exception e) { // 400
        ctx.status(400).json(new ApiErrorResponse(400, "Improper Object Format", "" + e, stackTraceString(e)));
    }

    private static void queryParamError(Context ctx, Exception e) { // 400
        ctx.status(400).json(new ApiErrorResponse(400, "Invalid Query Parameters", "" + e, stackTraceString(e)));
    }

    private static void notFound(Context ctx) { // 404
        ctx.status(404).json(new ApiErrorResponse(404, "Object Not Found", null, null));
    }

    private static void serverError(Context ctx, Exception e) { // 500
        ctx.status(500).json(new ApiErrorResponse(500, "Server Error", "" + e, stackTraceString(e)));
    }

    private static void databaseError(Context ctx, Exception e) { // 500
        ctx.status(500).json(new ApiErrorResponse(500, "Database Error", "" + e, stackTraceString(e)));
    }

    private static String stackTraceString(Exception e) {
        StringWriter stack = new StringWriter();
        e.printStackTrace(new PrintWriter(stack));
        return stack.toString();
    }

}
