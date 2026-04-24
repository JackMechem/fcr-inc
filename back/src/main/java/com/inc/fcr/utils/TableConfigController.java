package com.inc.fcr.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.javalin.http.Context;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.inc.fcr.errorHandling.ApiErrors.notFound;

/**
 * HTTP handler for the {@code /table-config} endpoints.
 *
 * <p>Returns and updates admin-UI configuration that controls which columns are
 * editable/locked and what actions (edit, delete, add row) each role may
 * perform on each resource table.</p>
 */
public class TableConfigController {

    public static class RoleConfig {
        public boolean canEdit;
        public boolean canDelete;
        public boolean canAddRow;
        public List<String> lockedCols;
        public List<String> permanentlyLockedCols;

        public RoleConfig() {}

        public RoleConfig(boolean canEdit, boolean canDelete, boolean canAddRow,
                          List<String> lockedCols, List<String> permanentlyLockedCols) {
            this.canEdit = canEdit;
            this.canDelete = canDelete;
            this.canAddRow = canAddRow;
            this.lockedCols = new ArrayList<>(lockedCols);
            this.permanentlyLockedCols = new ArrayList<>(permanentlyLockedCols);
        }
    }

    public static class TableConfig {
        public RoleConfig admin;
        public RoleConfig staff;

        public TableConfig() {}

        public TableConfig(RoleConfig admin, RoleConfig staff) {
            this.admin = admin;
            this.staff = staff;
        }
    }

    private static final Map<String, TableConfig> CONFIG = new HashMap<>(Map.of(
        "cars", new TableConfig(
            new RoleConfig(true, true, true, List.of(), List.of()),
            new RoleConfig(true, true, true, List.of("pricePerDay", "imageUrls"), List.of("vin"))
        ),
        "accounts", new TableConfig(
            new RoleConfig(true, true, true, List.of(), List.of()),
            new RoleConfig(true, false, true, List.of("role", "email"), List.of())
        ),
        "users", new TableConfig(
            new RoleConfig(true, true, true, List.of(), List.of()),
            new RoleConfig(true, false, true, List.of(), List.of())
        ),
        "reservations", new TableConfig(
            new RoleConfig(true, true, true, List.of("payments"), List.of()),
            new RoleConfig(true, false, false, List.of("car", "userId", "payments"), List.of("car", "userId"))
        ),
        "reviews", new TableConfig(
            new RoleConfig(true, true, true, List.of(), List.of()),
            new RoleConfig(true, false, false, List.of("account", "car"), List.of("account", "car"))
        )
    ));

    private static final ObjectMapper MAPPER = new ObjectMapper().findAndRegisterModules();

    /**
     * Handles {@code GET /table-config}.
     *
     * @param ctx the Javalin request context
     */
    public static void getAll(Context ctx) {
        ctx.json(CONFIG);
    }

    /**
     * Handles {@code GET /table-config/{table}}.
     *
     * <p>Returns 404 if the table name is not recognised.</p>
     *
     * @param ctx the Javalin request context
     */
    public static void getOne(Context ctx) {
        String table = ctx.pathParam("table").trim().toLowerCase();
        TableConfig config = CONFIG.get(table);
        if (config == null) notFound(ctx);
        else ctx.json(config);
    }

    /**
     * Handles {@code PATCH /table-config/{table}}.
     *
     * <p>Merges the request body into the existing config for the named table.
     * Returns 404 if the table name is not recognised.</p>
     *
     * @param ctx the Javalin request context
     */
    public static void update(Context ctx) {
        String table = ctx.pathParam("table").trim().toLowerCase();
        TableConfig config = CONFIG.get(table);
        if (config == null) { notFound(ctx); return; }
        try {
            MAPPER.setDefaultMergeable(false);
            MAPPER.readerForUpdating(config).readValue(ctx.body());
            ctx.status(201).json(config);
        } catch (Exception e) {
            ctx.status(500).json(Map.of("error", "Server Error", "message", e.getMessage()));
        }
    }
}
