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

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class DatabaseController {

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
        final String entity = clazz.getSimpleName();
        String filterClause = params.getFilterClause();
        String queryString  = (params.getSelectFields() != null ? "SELECT " + params.getSelectClause() + " " : "")
                + "FROM "+entity+" c" + filterClause + params.getSortClause();
        String countString  = "SELECT count(c) FROM "+entity+" c" + filterClause;
        // TODO: the 'c' here matters, it's connected to ParsedQueryParams...

        // Hibernate session
        Session session = HibernateUtil.getSessionFactory().openSession();

        // Get total items in database and calculate total pages
        long totalItems = session.createQuery(countString, Long.class).getSingleResult();
        int totalPages  = (int) Math.ceil((double) totalItems / limit);

        // Build object map and return
        if (params.getSelectFields() != null) {
            List<Object[]> rows = session.createQuery(queryString, Object[].class)
                    .setFirstResult(offset).setMaxResults(limit).getResultList();
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object[] row : rows) {
                Map<String, Object> objMap = new LinkedHashMap<>();
                for (int i = 0; i < params.getSelectFields().size(); i++)
                    objMap.put(params.getSelectFields().get(i), row[i]);
                result.add(objMap);
            }
            return new PagesWrapper(result, page, totalPages, totalItems);
        } else {
            List<?> rows = session.createQuery(queryString, clazz)
                    .setFirstResult(offset).setMaxResults(limit).getResultList();
            return new PagesWrapper(rows, page, totalPages, totalItems);
        }
    }

    public static Object getOne(Class<?> clazz, Object id) { return getOne(clazz, id, null); }

    public static Object getOne(Class<?> clazz, Object id, ParsedQueryParams params) throws HibernateException {
        // Get entity
        Session session = HibernateUtil.getSessionFactory().openSession();
        Object entity = session.get(clazz, id);

        if (params == null || !params.isSelecting()) {
            return entity;
        } else {
            // Filter down to selected fields
            ObjectMapper mapper = new ObjectMapper();
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
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            transaction = session.beginTransaction();
            session.merge(obj);
            transaction.commit();

            System.out.println("Object successfully " + (inserting ? "inserted" : "updated") + ".");

        } catch (Exception e) {
            if (transaction != null && transaction.isActive()) transaction.rollback();
            throw e;
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
