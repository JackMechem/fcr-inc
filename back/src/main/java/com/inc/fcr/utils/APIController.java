package com.inc.fcr.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.inc.fcr.database.ParsedQueryParams;
import com.inc.fcr.errorHandling.QueryParamException;
import com.inc.fcr.errorHandling.ValidationException;
import static com.inc.fcr.errorHandling.ApiErrors.*;
import io.javalin.http.Context;
import org.hibernate.HibernateException;

/**
 * Generic REST API controller providing standard CRUD endpoint handlers for any JPA entity.
 *
 * <p>Instantiated in {@link com.inc.fcr.Main} for each resource (cars, users, reservations,
 * payments). The entity class and its ID type are passed at construction time, allowing
 * one implementation to serve multiple resource types.</p>
 *
 * <p>All methods handle Javalin {@link Context} objects and delegate to
 * {@link DatabaseController} for persistence.</p>
 */
public class APIController {

    /** The JPA entity class this controller manages (e.g., {@code Car.class}). */
    protected final Class<?> clazz;
    /** The type of the entity's primary key (e.g., {@code String.class} for VIN, {@code Long.class} for auto-increment IDs). */
    protected final Class<?> idClazz;

    /**
     * Constructs an {@code APIController} for the given entity and ID types.
     *
     * @param clazz   the JPA entity class (e.g., {@code Car.class})
     * @param idClazz the type of the primary key (e.g., {@code String.class}, {@code Long.class})
     */
    public APIController(Class<?> clazz, Class<?> idClazz) {
        this.clazz = clazz;
        this.idClazz = idClazz;
    }

    /**
     * Handles {@code GET /{resource}}.
     *
     * <p>Parses query parameters (pagination, filtering, sorting, field selection) and
     * returns a paginated {@link com.inc.fcr.database.PagesWrapper}.</p>
     *
     * @param ctx the Javalin request context
     */
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

    /**
     * Handles {@code GET /{resource}/{id}}.
     *
     * <p>Returns the entity with the given ID, optionally limiting fields via the
     * {@code select} query parameter. Returns 404 if not found.</p>
     *
     * @param ctx the Javalin request context; {@code {id}} is the primary key
     */
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

    /**
     * Handles {@code POST /{resource}}.
     *
     * <p>Deserializes the request body into the entity class, checks for duplicate IDs,
     * and persists the new entity. Returns 201 on success.</p>
     *
     * @param ctx the Javalin request context; body must be a valid entity JSON object
     */
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

    /**
     * Handles {@code PATCH /{resource}/{id}}.
     *
     * <p>Fetches the existing entity, performs a shallow JSON merge of the request body
     * onto the existing object, then persists the result. Returns 201 on success,
     * 404 if the entity does not exist.</p>
     *
     * <p><strong>Note:</strong> Nested JSON objects are overridden entirely, not merged.</p>
     *
     * @param ctx the Javalin request context; body is a partial entity JSON object
     */
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
            mapper.findAndRegisterModules();
            // If set to true (default), changes to json objects will be appended to the existing content, not overridden
            mapper.setDefaultMergeable(false);
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

    /**
     * Handles {@code DELETE /{resource}/{id}}.
     *
     * <p>Deletes the entity with the given primary key. Returns 204 on success,
     * 404 if not found.</p>
     *
     * @param ctx the Javalin request context; {@code {id}} is the primary key
     */
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
