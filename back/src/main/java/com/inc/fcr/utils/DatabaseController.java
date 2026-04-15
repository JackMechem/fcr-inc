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

public class DatabaseController {

    public static final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    /*
     * Get One & All
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
        long totalItems = session.createQuery(countString, Long.class).getSingleResult();
        int totalPages  = (int) Math.ceil((double) totalItems / limit);

        // Get entities
        List<?> entities = session.createQuery(queryString, clazz).setFirstResult(offset).setMaxResults(limit).getResultList();
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

    public static Object getOne(Class<?> clazz, Object id)  throws HibernateException {
        try { return getOne(clazz, id, null); }
        catch (QueryParamException impossible) { return null; }
    }

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

    public static void insert(Object obj) throws HibernateException { insertUpdate(obj, true); }
    public static void update(Object obj) throws HibernateException { insertUpdate(obj, false); }

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
