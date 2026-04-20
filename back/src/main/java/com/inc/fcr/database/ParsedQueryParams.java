package com.inc.fcr.database;

import java.beans.Transient;
import java.lang.reflect.Field;
import java.time.Instant;
import java.time.temporal.Temporal;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.inc.fcr.errorHandling.QueryParamException;
import com.inc.fcr.utils.APIEntity;
import jakarta.persistence.Id;
import jakarta.persistence.Query;
import joptsimple.internal.Strings;

/**
 * Parses, validates, and builds SQL clauses from HTTP query parameters.
 *
 * <p>Constructed once per request from the Javalin query parameter map and the
 * target entity class. Uses reflection to discover the entity's fields at runtime,
 * building field maps and filter parsers automatically.</p>
 *
 * <p><strong>Supported query parameters:</strong></p>
 * <ul>
 *   <li>{@code select}   — comma-separated list of fields to return</li>
 *   <li>{@code sortBy}   — field name to sort by (defaults to the entity's {@code @Id} field)</li>
 *   <li>{@code sortDir}  — {@code asc} or {@code desc} (default: {@code asc})</li>
 *   <li>{@code page}     — 1-based page number (default: 1)</li>
 *   <li>{@code pageSize} — results per page (default: 10)</li>
 *   <li>{@code search}   — full-text search across {@link SearchField}-annotated fields</li>
 *   <li>{@code min<Field>} / {@code max<Field>} — range filter on numeric fields</li>
 *   <li>{@code <field>}  — exact or enum match filter</li>
 *   <li>{@code parseFullObjects} - determines if objects parse/return nested objects or just IDs (full car object vs just VIN). </li>
 * </ul>
 *
 * <p>Strict mode (controlled by the {@code STRICT_QUERY_PARAMS} environment variable,
 * default {@code true}) throws {@link QueryParamException} for unrecognized field names.</p>
 */
public class ParsedQueryParams {

    // Static Variables
    // ----------------

    private static final boolean STRICT_QUERY_PARAMS = Boolean
            .parseBoolean(System.getenv().getOrDefault("STRICT_QUERY_PARAMS", "true"));

    private static final int DEFAULT_PAGE_SIZE = 10;

    // Initialize Field Maps
    // ---------------------

    private void mapClassFields() throws QueryParamException {
        Set<String> searchFields = new LinkedHashSet<>();
        Set<String> numericSet = new LinkedHashSet<>();
        Set<String> temporalSet = new LinkedHashSet<>();
        Map<String, String> fieldMap = new LinkedHashMap<>();
        Map<String, String> alphaFieldMap = new LinkedHashMap<>();
        Map<String, List<String>> enumValues = new HashMap<>();

        if (!APIEntity.class.isAssignableFrom(clazz))
            throw new QueryParamException("Entity does not extend APIEntity.");

        for (Field field : clazz.getDeclaredFields()) {
            // Filter unwanted fields
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers())) continue;
            if (field.isAnnotationPresent(Transient.class)) continue;
            // Build field maps
            final String name = field.getName();
            final Class<?> type = field.getType();

            if (field.isAnnotationPresent(Id.class)) idName = name;
            if (field.isAnnotationPresent(SearchField.class)) searchFields.add(name);

            fieldMap.put(name.toLowerCase(), name);

            if (isNumericClass(type)) numericSet.add(name);
            else if (Temporal.class.isAssignableFrom(type)) temporalSet.add(name);
            else alphaFieldMap.put(name.toLowerCase(), name);

            if (type.isEnum()) {
                var eType = (Class<? extends Enum>) type;
                enumValues.put(name, Arrays.stream(eType.getEnumConstants()).map(Enum::name).toList());
            }
        }
        SEARCH_FIELDS = Collections.unmodifiableSet(searchFields);
        NUMERIC_FIELDS = Collections.unmodifiableSet(numericSet);
        TEMPORAL_FIELDS = Collections.unmodifiableSet(temporalSet);
        FIELD_MAP = Collections.unmodifiableMap(fieldMap);
        ALPHA_FIELD_MAP = Collections.unmodifiableMap(alphaFieldMap);
        ENUM_VALUES = Collections.unmodifiableMap(enumValues);
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
    private String idName;
    private boolean sortBySet = false;
    private boolean parseFullObjects = false;
    private int page = 1;
    private int pageSize = DEFAULT_PAGE_SIZE;
    private String searchText;
    private List<String> parsedSearchText;

    private final Class<?> clazz;
    private Set<String> SEARCH_FIELDS;
    private Set<String> NUMERIC_FIELDS; // numeric only
    private Set<String> TEMPORAL_FIELDS; // date type fields
    private Map<String, String> FIELD_MAP; // contains alpha & numeric
    private Map<String, String> ALPHA_FIELD_MAP; // strings only
    private Map<String, List<String>> ENUM_VALUES;

    // Params Constructor
    // ------------------

    /**
     * Constructs a {@code ParsedQueryParams} by reflecting on the entity class and
     * parsing all provided query parameters.
     *
     * @param clazz       the JPA entity class to derive field metadata from
     * @param queryParams the raw query parameter map from the HTTP request
     * @throws QueryParamException if strict mode is enabled and an invalid field or
     *                             enum value is encountered
     */
    public ParsedQueryParams(Class<?> clazz, Map<String, List<String>> queryParams) throws QueryParamException {
        this.clazz = clazz;
        mapClassFields();
        parseQueryParams(queryParams);
    }

    // Data Processing
    // ---------------

    private void parseQueryParams(Map<String, List<String>> queryParams) throws QueryParamException {
        for (Map.Entry<String, List<String>> entry : queryParams.entrySet()) {
            String key = entry.getKey().trim().toLowerCase();
            String val = entry.getValue().getFirst().trim();
            switch (key) {
                case "parsefullobjects" -> parseFullObjects = Boolean.parseBoolean(val);
                case "select" -> parseSelect(entry.getValue());
                case "sortby" -> {
                    if (FIELD_MAP.containsKey(val.toLowerCase())) {
                        sortBy = FIELD_MAP.get(val.toLowerCase());
                        sortBySet = true;
                    }
                }
                case "sortdir" -> sortDir = val.equalsIgnoreCase("desc") ? SortStyle.DESCENDING : SortStyle.ASCENDING;
                case "page" -> page = Math.max(1, Integer.parseInt(val));
                case "pagesize" -> pageSize = Integer.parseInt(val) < 1 ? DEFAULT_PAGE_SIZE : Integer.parseInt(val);
                case "search" -> searchText = parseSearchText(val);
                default -> {
                    if (key.startsWith("min") || key.startsWith("max")) {
                        String field = FIELD_MAP.get(key.substring(3));
                        if (field != null && (NUMERIC_FIELDS.contains(field) || TEMPORAL_FIELDS.contains(field))) {
                            if (filterFields != null)
                                filterFields.remove("exact_" + field);
                            parseFilter(key.substring(3), val, key.substring(0,3));
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
        if (filterFields == null) filterFields = new LinkedHashMap<>();

        String properKey = FIELD_MAP.get(key);
        if (rangeType != null) {
            if (TEMPORAL_FIELDS.contains(properKey))
                filterFields.put(rangeType + "T_" + properKey, val); // Temporal type
            else filterFields.put(rangeType + "_" + properKey, val); // Numeric type
        }
        else filterFields.put(properKey, val);
    }

    /** Parse and clean up raw search text and initialize parsedSearchText list */
    private String parseSearchText(String rawSearchText) {
        rawSearchText = rawSearchText.trim().toLowerCase();
        parsedSearchText = List.of(rawSearchText.replaceAll(" -"," ").split(" "));
        return rawSearchText;
    }

    // Getters
    // -------

    /**
     * DEPRECATED
     * Builds the HQL {@code SELECT} clause from the parsed select fields.
     *
     * <p>Example output: {@code "c.vin, c.make, c.model"}</p>
     *
     * @return the select clause string with entity alias {@code c}
     * @throws QueryParamException if select fields are not set
     */

    public String getSelectClause() throws QueryParamException {
        return selectFields.stream()
                .map(f -> "c." + f)
                .collect(Collectors.joining(", "));
    }

    /**
     * Builds the HQL {@code WHERE} clause from parsed filter and search parameters.
     *
     * <p>Always starts with {@code WHERE 1=1} so additional {@code AND} conditions
     * can be appended safely. Handles min/max range filters, exact numeric matches,
     * enum matches, string matches, and the full-text search clause (requires populating search clause separately).</p>
     *
     * @return the complete WHERE clause string
     * @throws QueryParamException if an enum filter value is invalid and strict mode is on
     */
    public String getFilterClause() throws QueryParamException {
        StringBuilder sb = new StringBuilder(" WHERE 1=1");
        if (filterFields != null) {
            for (Map.Entry<String, String> entry : filterFields.entrySet()) {
                String field = entry.getKey(), value = entry.getValue();
                if (field.startsWith("min_")) {
                    sb.append(" AND c.").append(field.substring(4)).append(" >= ").append(value);
                } else if (field.startsWith("max_")) {
                    sb.append(" AND c.").append(field.substring(4)).append(" <= ").append(value);
                } else if (field.startsWith("exact_")) {
                    sb.append(" AND c.").append(field.substring(6)).append(" = ").append(value);
                } else if (field.startsWith("minT_")) {
                    sb.append(" AND c.").append(field.substring(5)).append(" >= :").append(field);
                } else if (field.startsWith("maxT_")) {
                    sb.append(" AND c.").append(field.substring(5)).append(" <= :").append(field);
                } else if (ENUM_VALUES.containsKey(field)) {
                    if (ENUM_VALUES.get(field).contains(value.toUpperCase())) {
                        sb.append(" AND c.").append(field).append(" = ").append(value.toUpperCase());
                    } else if (value.contains(",")) {
                        // try to parse as multiple enum values separated by commas
                        sb.append(" AND (1=0 "); // start a new condition group that will be ORed together
                        Arrays.stream(value.split(","))
                                .map(String::trim).map(String::toUpperCase) // preprocessing
                                .filter(v -> ENUM_VALUES.get(field).contains(v)) // validation
                                .forEach(v -> sb.append(" OR c.").append(field).append(" = '").append(v).append("'"));
                        sb.append(")"); // close the condition group
                    } else if (STRICT_QUERY_PARAMS) {
                        throw new QueryParamException(
                            "Invalid value '" + value + "' for '" + field + "'. Valid options: " + ENUM_VALUES.get(field)
                        );
                    }
                } else {
                    sb.append(" AND c.").append(field).append(" = '").append(value).append("'");
                }
            }
        }
        if (searchText != null) sb.append(" AND " + getSearchClause() + " > 0");
        return sb.toString();
    }

    /**
     * Builds the HQL search clause.
     * Requires parameters to be set separately after query creation
     * in order to avoid possible SQL injections.
     *
     * <p>Clause supports searching through {@code SEARCH_FIELDS} matching
     * with regex exact text matches of each word separated by a space.
     * Supports inverted matches, excluding matches starting with '-'.</p>
     *
     * @return the search clause string usable in ORDER and WHERE
     */
    private String getSearchClause() {
        if (searchText == null) return "";
        var i = new AtomicInteger(); // java stupidity equivalent to: int i = 0; and i++ below
        return Strings.join(Arrays.stream(searchText.split(" ")).map(e -> {
            boolean invertedMatch = e.startsWith("-");
            if (invertedMatch) e = e.substring(1);
            return " CAST( REGEXP_LIKE(CONCAT_WS(' ', " + searchFieldsToStr() + "), :searchText"+ i.getAndIncrement() +", 'i') AS int) "
                    + (invertedMatch ? "*-10" : ""); // large negative weight against inverted matches
        }).toList(), " + ");
    }

    /** Helper function for search field processing called by {@code getSearchClause()} */
    private String searchFieldsToStr() {
        return Strings.join(SEARCH_FIELDS.stream().map(e -> "c." + e).toList(), ", ");
    }

    /** Fills out search parameter fields on given query expected to be generated from the same */
    public Query setPotentialParams(Query q) {
        if (parsedSearchText != null) {
            // fill in parsed search text safely
            var i = new AtomicInteger();
            parsedSearchText.forEach(e -> q.setParameter("searchText" + i.getAndIncrement(), e));
        }
        if (filterFields != null) {
            filterFields.keySet().stream().filter(k -> k.startsWith("T_", 3))
                    .forEach(k -> q.setParameter(k, Instant.parse(filterFields.get(k))) );
        }
        return q;
     }

     /**
     * Builds the HQL {@code ORDER BY} clause.
     *
     * <p>When a search is active and no explicit {@code sortBy} was given,
     * results are ordered by search relevance score descending. Otherwise,
     * the configured sort field and direction are used.</p>
     *
     * @return the ORDER BY clause string
     */
    public String getSortClause() {
        return (sortBySet || searchText == null) ?
                " ORDER BY c." + (sortBySet ? sortBy : idName) + getSortDirClause()
                : " ORDER BY " + getSearchClause() + " DESC";
    }

    private String getSortDirClause() {
        return (sortDir == SortStyle.DESCENDING) ? " DESC" : " ASC";
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

    public String getIdName() {
        return idName;
    }

    public int getPage() {
        return page;
    }

    public int getPageSize() {
        return pageSize;
    }

    public boolean getParseFullObjects() {
        return parseFullObjects;
    }

    /**
     * OBSOLETE / DEPRECATED
     * Adds a VIN equality filter to the existing filter fields.
     *
     * <p>No longer used by {@link com.inc.fcr.utils.DatabaseController} to
     * narrow a select query to a specific car.</p>
     *
     * @param vin the VIN value to filter on
     */

    public void setVinFilter(String vin) {
        if (filterFields == null)
            filterFields = new LinkedHashMap<>();
        filterFields.put("vin", vin);
    }

    /**
     * Prints the current parsed parameter state to stdout for debugging.
     */

    public void printParams() {
        System.out.println("selectFields: " + selectFields);
        System.out.println("filterFields: " + filterFields);
        System.out.println("searchClause: " + getSearchClause());
        System.out.println("sortDir:      " + sortDir);
        System.out.println("sortBy:       " + sortBy);
        System.out.println("page:         " + page);
        System.out.println("pageSize:     " + pageSize);
    }
}
