package com.inc.fcr.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.database.PagesWrapper;
import com.inc.fcr.database.ParsedQueryParams;
import com.inc.fcr.errorHandling.QueryParamException;
import com.inc.fcr.errorHandling.ValidationException;
import jakarta.persistence.PersistenceUnitUtil;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.*;

/**
 * Generic database access layer for all JPA entities.
 *
 * <p>Provides reusable CRUD operations that work with any entity class via
 * generics and reflection. Used by {@link APIController} for the standard
 * REST endpoints (cars, users, reservations, payments).</p>
 *
 * <p>For car-specific operations with custom query logic, see
 * {@link com.inc.fcr.utils.DatabaseController}.</p>
 */
public class DatabaseController {

    public static final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    /*
     * Get One & All
     */

    /**
     * Retrieves a paginated list of entities of the given class, applying filters,
     * sorting, and optional field selection from {@code params}.
     *
     * @param clazz  the entity class to query (e.g., {@code Car.class})
     * @param params parsed and validated query parameters
     * @return a {@link PagesWrapper} containing the result page and pagination metadata
     * @throws HibernateException  if the database query fails
     * @throws QueryParamException if filter/select clauses contain invalid values
     */
    public static PagesWrapper getAll(Class<?> clazz, ParsedQueryParams params) throws HibernateException, QueryParamException {
        params.printParams();

        // Page variables
        int limit  = params.getPageSize();
        int page   = params.getPage();
        int offset = (page - 1) * limit;

        // Make SQL query strings
        final String entityName = clazz.getSimpleName();
        String filterClause = params.getFilterClause();
        String queryString  = "FROM "+entityName+" c" + filterClause + params.getSortClause();
        String countString  = "SELECT count(c) FROM "+entityName+" c" + filterClause;
        // The 'c' here matters, it's connected to ParsedQueryParams

        Session session = HibernateUtil.getSessionFactory().openSession();
        // Get total items in database and calculate total pages
        long totalItems = (long) params.setPotentialParams(session.createQuery(countString, Long.class)).getSingleResult();
        int totalPages  = (int) Math.ceil((double) totalItems / limit);

        // Get entities
        List<?> entities = params.setPotentialParams(session.createQuery(queryString, clazz))
                .setFirstResult(offset).setMaxResults(limit).getResultList();
        if (params.getParseFullObjects()) entities.stream().forEach(c -> ((APIEntity) c).parseFullObjects = true);

        if (!params.isSelecting()) {
            return new PagesWrapper(entities, page, totalPages, totalItems);
        } else {
            return new PagesWrapper(entities.stream().map(entity -> {
                // Filter down to selected fields
                Map<String, Object> map = mapper.convertValue(entity, Map.class);
                map.keySet().removeIf(k -> !params.getSelectFields().contains(k.toLowerCase()));
                return map;
            }).toList(), page, totalPages, totalItems);
        }
    }

    /**
     * Retrieves a single entity by primary key without field selection.
     *
     * @param clazz the entity class to query
     * @param id    the primary key value
     * @return the entity, or {@code null} if not found
     */
    public static Object getOne(Class<?> clazz, Object id) throws HibernateException {
        try { return getOne(clazz, id, null); }
        catch (QueryParamException impossible) { return null; }
    }

    /**
     * Retrieves a single entity by primary key, optionally limiting the returned
     * fields to those specified in {@code params}.
     *
     * <p>When field selection is active, returns a {@code Map<String, Object>} instead
     * of the full entity object.</p>
     *
     * @param clazz  the entity class to query
     * @param id     the primary key value
     * @param params optional parsed query parameters for field selection; may be {@code null}
     * @return the full entity, a field-selected map, or {@code null} if not found
     * @throws HibernateException if the database query fails
     */
    public static Object getOne(Class<?> clazz, Object id, ParsedQueryParams params) throws HibernateException, QueryParamException {
        // Get entity
        Session session = HibernateUtil.getSessionFactory().openSession();
        Object entity = session.get(clazz, id);

        if (params == null) return entity;
        else if (params.getParseFullObjects()) ((APIEntity) entity).parseFullObjects = true;

        if (!params.isSelecting()) return entity;
        else {
            // Filter down to selected fields
            Map<String, Object> map = mapper.convertValue(entity, Map.class);
            map.keySet().removeIf(k -> !params.getSelectFields().contains(k.toLowerCase()));
            return map;
        }
    }

    /*
     * Insert & Update
     */

    /**
     * Persists a new entity to the database.
     *
     * @param obj the entity to insert
     * @throws HibernateException if the database operation fails
     */
    public static void insert(Object obj) throws HibernateException { insertUpdate(obj, true); }

    /**
     * Updates an existing entity in the database.
     *
     * @param obj the entity with updated fields
     * @throws HibernateException if the database operation fails
     */
    public static void update(Object obj) throws HibernateException { insertUpdate(obj, false); }

    /**
     * Internal helper that persists an entity via {@code session.merge()}.
     *
     * @param obj       the entity to persist
     * @param inserting {@code true} for insert logging, {@code false} for update logging
     * @throws HibernateException if the database operation fails
     */
    public static void insertUpdate(Object obj, boolean inserting) throws HibernateException {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            var transaction = session.beginTransaction();
            session.merge(obj);
            transaction.commit();

            System.out.println("Object successfully " + (inserting ? "inserted" : "updated") + ".");
        }
    }

    /*
     * Delete
     */

    /**
     * Deletes an entity by its primary key.
     *
     * @param clazz the entity class
     * @param id    the primary key of the entity to delete
     * @throws HibernateException  if the database operation fails
     * @throws ValidationException if no entity with the given ID is found
     */
    public static void delete(Class<?> clazz, Object id) throws HibernateException, ValidationException {
        Session session = HibernateUtil.getSessionFactory().openSession();
        Object obj = session.get(clazz, id);

        if (obj != null) {
            Transaction transaction = session.beginTransaction();
            session.remove(obj);
            transaction.commit();

            System.out.println("Object " + id + " was deleted.");
        } else {
            throw new ValidationException("Object not found.");
        }
    }


    // Helper methods
    // --------------
    /**
     * Checks whether an entity with the same primary key already exists in the database.
     *
     * <p>Uses JPA's {@link jakarta.persistence.PersistenceUnitUtil} to extract the
     * identifier reflectively, so it works for any entity type regardless of ID field name.</p>
     *
     * @param obj   the entity whose ID to look up
     * @param clazz the entity class
     * @return {@code true} if an entity with the same ID exists; {@code false} otherwise
     */
    public static boolean objectExists(Object obj, Class<?> clazz) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            // Need this funky method to dynamically grab the id regardless of what it's called
            PersistenceUnitUtil util = session.getEntityManagerFactory().getPersistenceUnitUtil();
            Object id = util.getIdentifier(obj);

            return (id != null) && (session.get(clazz, id) != null);
        } catch (Exception e) {
            return false;
        }
    }
}
