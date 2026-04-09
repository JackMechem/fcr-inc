package com.inc.fcr.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.database.ParsedQueryParams;
import com.inc.fcr.errorHandling.QueryParamException;
import com.inc.fcr.errorHandling.ValidationException;
import static com.inc.fcr.errorHandling.ApiErrors.*;
import io.javalin.http.Context;
import org.hibernate.HibernateException;

public class APIController {

    // API constructor
    // ----------------
    protected final Class<?> clazz;
    protected final Class<?> idClazz;

    // Creates an API Controller from a class and the class of its ID
    public APIController(Class<?> clazz, Class<?> idClazz) {
        this.clazz = clazz;
        this.idClazz = idClazz;
    }

    // Abstract methods
    // ----------------
    public void getAll(Context ctx) {
        try {
            var parsedQueryParams = new ParsedQueryParams(clazz, ctx.queryParamMap());
            ctx.json(DatabaseController.getAll(clazz, parsedQueryParams));
        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public void getOne(Context ctx) {
        try {
            Object id = ctx.pathParamAsClass("id", idClazz).get();
            var parsedQueryParams = new ParsedQueryParams(clazz, ctx.queryParamMap());
            Object obj = DatabaseController.getOne(clazz, id, parsedQueryParams);

            if (obj == null) notFound(ctx);
            else ctx.json(obj);

        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public void create(Context ctx) {
        try {
            // Parse object
            Object obj = ctx.bodyAsClass(clazz);

            // Check exists
            if (DatabaseController.objectExists(obj, clazz)) {
                throw new ValidationException("Object with that ID already exists.");
            }
            // Save to database
            DatabaseController.insert(obj);
            ctx.status(201);

        } catch (Exception e) {
            if (e instanceof ValidationException) formatError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public void update(Context ctx) {
        try {
            // Get from database
            Object id = ctx.pathParamAsClass("id", idClazz).get();
            Object oldObj = DatabaseController.getOne(clazz, id);
            if (oldObj == null) {
                notFound(ctx);
                return;
            }

            // Merge specified fields
            ObjectMapper mapper = new ObjectMapper();
            JsonNode objJson = mapper.valueToTree(oldObj);
            // NOTE: Shallow merge, nested trees overridden!
            mapper.readerForUpdating(objJson).readTree(ctx.body());
            Object obj = mapper.convertValue(objJson, clazz);

            // Update object
            DatabaseController.update(obj);
            ctx.status(201);

        } catch (Exception e) {
            if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    public void delete(Context ctx) {
        try {
            Object id = ctx.pathParamAsClass("id", idClazz).get();
            DatabaseController.delete(clazz, id);
            ctx.status(204);
        } catch (Exception e) {
            if (e instanceof ValidationException) notFound(ctx);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }
}
