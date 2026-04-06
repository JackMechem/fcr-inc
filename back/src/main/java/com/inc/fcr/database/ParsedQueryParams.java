package com.inc.fcr.database;

import java.beans.Transient;
import java.lang.reflect.Field;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.inc.fcr.car.enums.*;
import com.inc.fcr.errorHandling.QueryParamException;
import jakarta.persistence.Id;

public class ParsedQueryParams {

    // Static Variables
    // ----------------

    private static final boolean STRICT_QUERY_PARAMS = Boolean
            .parseBoolean(System.getenv().getOrDefault("STRICT_QUERY_PARAMS", "true"));

    private static final int DEFAULT_PAGE_SIZE = 10;

    // Initialize Field Maps
    // ---------------------

    private void mapClassFields() {
        Set<String> numericSet = new LinkedHashSet<>();
        Map<String, String> fieldMap = new LinkedHashMap<>();
        Map<String, String> alphaFieldMap = new LinkedHashMap<>();
        Map<String, Function<String, Object>> filterParsers = new HashMap<>();
        Map<String, String> filterValidValues = new HashMap<>();

        for (Field field : clazz.getDeclaredFields()) {
            // Filter unwanted fields
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers())) continue;
            if (field.isAnnotationPresent(Transient.class)) continue;
            // Build field maps
            final String name = field.getName();
            final Class<?> type = field.getType();

            if (field.isAnnotationPresent(Id.class)) sortBy = name;

            fieldMap.put(name.toLowerCase(), name);
            if (isNumericClass(type)) numericSet.add(name);
            else alphaFieldMap.put(name.toLowerCase(), name);

            if (type.isEnum()) {
                Class<? extends Enum> eType = (Class<? extends Enum>) type;
                filterParsers.put(name, val -> Enum.valueOf(eType, val.toUpperCase()));
                filterValidValues.put(name, String.join(",", Arrays.stream(eType.getEnumConstants()).map(Enum::name).toList()));
            }
        }
        NUMERIC_FIELDS = Collections.unmodifiableSet(numericSet);
        FIELD_MAP = Collections.unmodifiableMap(fieldMap);
        ALPHA_FIELD_MAP = Collections.unmodifiableMap(alphaFieldMap);
        FILTER_PARSERS = Collections.unmodifiableMap(filterParsers);
        FILTER_VALID_VALUES = Collections.unmodifiableMap(filterValidValues);
    }

    private static boolean isNumericClass(Class<?> clazz) {
        return Number.class.isAssignableFrom(clazz) // handles object versions
                || clazz == int.class
                || clazz == long.class
                || clazz == double.class
                || clazz == float.class
                || clazz == short.class
                || clazz == byte.class;
    }

    // Instance Variables
    // ------------------

    private List<String> selectFields = null;
    private Map<String, String> filterFields = null;
    private SortStyle sortDir = SortStyle.ASCENDING;
    private String sortBy;
    private int page = 1;
    private int pageSize = DEFAULT_PAGE_SIZE;

    private final Class<?> clazz;
    private Set<String> NUMERIC_FIELDS; // numeric only
    private Map<String, String> FIELD_MAP; // contains alpha & numeric
    private Map<String, String> ALPHA_FIELD_MAP; // strings only
    private Map<String, Function<String, Object>> FILTER_PARSERS;
    private Map<String, String> FILTER_VALID_VALUES;

    // Params Constructor
    // ------------------

    public ParsedQueryParams(Class<?> clazz, Map<String,List<String>> queryParams) throws QueryParamException {
        this.clazz = clazz;
        mapClassFields();
        parseQueryParams(queryParams);
    }

    // Data Processing
    // ---------------

    private void parseQueryParams(Map<String,List<String>> queryParams) throws  QueryParamException {
        for (Map.Entry<String, List<String>> entry : queryParams.entrySet()) {
            String key = entry.getKey().trim().toLowerCase();
            String val = entry.getValue().getFirst().trim();
            switch (key) {
                case "select" -> parseSelect(entry.getValue());
                case "sortby" -> {
                    if (FIELD_MAP.containsKey(val.toLowerCase()))
                        sortBy = FIELD_MAP.get(val.toLowerCase());
                }
                case "sortdir" -> sortDir = val.equalsIgnoreCase("desc") ? SortStyle.DESCENDING : SortStyle.ASCENDING;
                case "page" -> page = Math.max(1, Integer.parseInt(val));
                case "pagesize" -> pageSize = Integer.parseInt(val) < 1 ? DEFAULT_PAGE_SIZE : Integer.parseInt(val);
                default -> {
                    if (key.startsWith("min") || key.startsWith("max")) {
                        String field = FIELD_MAP.get(key.substring(3).toLowerCase());
                        if (field != null && NUMERIC_FIELDS.contains(field)) {
                            if (filterFields != null)
                                filterFields.remove("exact_" + field);
                            parseFilter(key.substring(3).toLowerCase(), val, key.startsWith("min") ? "min" : "max");
                        }
                    } else if (FIELD_MAP.containsKey(key) && NUMERIC_FIELDS.contains(FIELD_MAP.get(key))) {
                        String field = FIELD_MAP.get(key);
                        if (filterFields == null || (!filterFields.containsKey("min_" + field)
                                && !filterFields.containsKey("max_" + field)))
                            parseFilter(key, val, "exact");
                    } else if (FIELD_MAP.containsKey(key)) {
                        parseFilter(key, val, null);
                    }
                }
            }
        }

    }

    private void parseSelect(List<String> values) throws QueryParamException {
        if (values.isEmpty()) {
            if (STRICT_QUERY_PARAMS) {
                throw new QueryParamException("Valid fields for 'select': " + String.join(", ", FIELD_MAP.keySet()));
            } else {
                selectFields = null;
                return;
            }
        }
        if (selectFields == null)
            selectFields = new ArrayList<>();
        for (String val : values) {
            for (String field : val.split(",")) {
                String mapped = FIELD_MAP.get(field.trim().toLowerCase());
                if (mapped != null && !selectFields.contains(mapped))
                    selectFields.add(mapped);
                else if (mapped == null) {
                    if (STRICT_QUERY_PARAMS) {
                        throw new QueryParamException("Invalid select field: '" + field.trim() + "'. Valid fields: "
                                + String.join(", ", FIELD_MAP.keySet()));
                    }

                }
            }
        }
        if (selectFields.isEmpty())
            if (STRICT_QUERY_PARAMS) {
                throw new QueryParamException("Valid fields for 'select': " + String.join(", ", FIELD_MAP.keySet()));
            } else {
                selectFields = null;
                return;
            }
    }

    private void parseFilter(String key, String val, String rangeType) {
        if (filterFields == null)
            filterFields = new LinkedHashMap<>();
        String properKey = FIELD_MAP.get(key);
        if (rangeType != null)
            filterFields.put(rangeType + "_" + properKey, val);
        else
            filterFields.put(properKey, val);
    }

    // Getters
    // -------

    public String getSelectClause() throws QueryParamException {
        return selectFields.stream()
                .map(f -> "c." + f)
                .collect(Collectors.joining(", "));
    }

    public String getFilterClause() throws QueryParamException {
        StringBuilder sb = new StringBuilder(" WHERE 1=1");
        if (filterFields == null)
            return sb.toString();
        for (Map.Entry<String, String> entry : filterFields.entrySet()) {
            String field = entry.getKey(), value = entry.getValue();
            if (field.startsWith("min_")) {
                sb.append(" AND c.").append(field.substring(4)).append(" >= ").append(value);
            } else if (field.startsWith("max_")) {
                sb.append(" AND c.").append(field.substring(4)).append(" <= ").append(value);
            } else if (field.startsWith("exact_")) {
                sb.append(" AND c.").append(field.substring(6)).append(" = ").append(value);
            } else if (FILTER_PARSERS.containsKey(field)) {
                if (FILTER_VALID_VALUES.get(field).contains(value.toUpperCase())) {
                    sb.append(" AND c.").append(field).append(" = ");
                    sb.append(FILTER_PARSERS.get(field).apply(value));
                } else if (STRICT_QUERY_PARAMS) {
                    throw new QueryParamException(
                            "Invalid value '" + value + "' for '" + field + "'. Valid options: "
                                    + FILTER_VALID_VALUES.get(field));
                }
            } else {
                sb.append(" AND c.").append(field).append(" = '").append(value).append("'");
            }
        }
        return sb.toString();
    }

    public String getSortClause() {
        return " ORDER BY c." + sortBy + (sortDir == SortStyle.DESCENDING ? " DESC" : " ASC");
    }

    public boolean isSelecting() {
        return (selectFields != null) && (!selectFields.isEmpty());
    }

    public List<String> getSelectFields() {
        return selectFields;
    }

    public Map<String, String> getFilterFields() {
        return filterFields;
    }

    public SortStyle getSortDir() {
        return sortDir;
    }

    public String getSortBy() {
        return sortBy;
    }

    public int getPage() {
        return page;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setVinFilter(String vin) {
        if (filterFields == null)
            filterFields = new LinkedHashMap<>();
        filterFields.put("vin", vin);
    }

    public void printParams() {
        System.out.println("selectFields: " + selectFields);
        System.out.println("filterFields: " + filterFields);
        System.out.println("sortDir:      " + sortDir);
        System.out.println("sortBy:       " + sortBy);
        System.out.println("page:         " + page);
        System.out.println("pageSize:     " + pageSize);
    }
}
