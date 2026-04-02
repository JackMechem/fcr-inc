package com.inc.fcr.errorHandling;

import io.javalin.http.Context;
import io.javalin.openapi.*;

import java.io.PrintWriter;
import java.io.StringWriter;

import com.inc.fcr.car.enums.*;

public final class ApiErrors {

    public static void reDirectError(Context ctx) { // 300
        ctx.status(302).header("Location", "/new-location");
    }

    public static void badRequest(Context ctx, Exception e) { // 400
        ctx.status(400).json(new ApiErrorResponse(400, "Bad Request", "" + e, stackTraceString(e)));
    }

    public static void notFound(Context ctx) { // 400
        ctx.status(404).json(new ApiErrorResponse(404, "Not Found", null, null));
    }

    public static void serverError(Context ctx, Exception e) { // 500
        ctx.status(500).json(new ApiErrorResponse(500, "Server Error", "" + e, stackTraceString(e)));
    }

    private static String stackTraceString(Exception e) {
        StringWriter stack = new StringWriter();
        e.printStackTrace(new PrintWriter(stack));
        return stack.toString();
    }

}
