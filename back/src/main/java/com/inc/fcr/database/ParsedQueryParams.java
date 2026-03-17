package com.inc.fcr.database;

import java.beans.Transient;
import java.lang.reflect.Field;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.inc.fcr.car.Car;
import com.inc.fcr.car.enums.*;
import com.inc.fcr.errorHandling.QueryParamException;

public class ParsedQueryParams {

    private static final boolean STRICT_QUERY_PARAMS = Boolean
            .parseBoolean(System.getenv().getOrDefault("STRICT_QUERY_PARAMS", "true"));

    private static final int DEFAULT_PAGE_SIZE = 10;

    private static final Map<String, String> FIELD_MAP;
    static {
        Map<String, String> map = new LinkedHashMap<>();
        for (Field field : Car.class.getDeclaredFields()) {
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers()))
                continue;
            if (field.isAnnotationPresent(Transient.class))
                continue;
            map.put(field.getName().toLowerCase(), field.getName());
        }
        FIELD_MAP = Collections.unmodifiableMap(map);
    }

    private static final Map<String, Function<String, Object>> FILTER_PARSERS = Map.ofEntries(
            Map.entry("transmission", v -> TransmissionType.valueOf(v.toUpperCase())),
            Map.entry("drivetrain", v -> Drivetrain.valueOf(v.toUpperCase())),
            Map.entry("engineLayout", v -> EngineLayout.valueOf(v.toUpperCase())),
            Map.entry("fuel", v -> FuelType.valueOf(v.toUpperCase())),
            Map.entry("bodyType", v -> BodyType.valueOf(v.toUpperCase())),
            Map.entry("roofType", v -> RoofType.valueOf(v.toUpperCase())),
            Map.entry("vehicleClass", v -> VehicleClass.valueOf(v.toUpperCase())));

    private static final Map<String, String> FILTER_VALID_VALUES = Map.ofEntries(
            Map.entry("transmission",
                    String.join(", ", Arrays.stream(TransmissionType.values()).map(Enum::name).toList())),
            Map.entry("drivetrain", String.join(", ", Arrays.stream(Drivetrain.values()).map(Enum::name).toList())),
            Map.entry("engineLayout", String.join(", ", Arrays.stream(EngineLayout.values()).map(Enum::name).toList())),
            Map.entry("fuel", String.join(", ", Arrays.stream(FuelType.values()).map(Enum::name).toList())),
            Map.entry("bodyType", String.join(", ", Arrays.stream(BodyType.values()).map(Enum::name).toList())),
            Map.entry("roofType", String.join(", ", Arrays.stream(RoofType.values()).map(Enum::name).toList())),
            Map.entry("vehicleClass",
                    String.join(", ", Arrays.stream(VehicleClass.values()).map(Enum::name).toList())));

    private List<String> selectFields = null;
    private Map<String, String> filterFields = null;
    private SortStyle sortDir = SortStyle.ASCENDING;
    private String sortBy = "make";
    private int page = 1;
    private int pageSize = DEFAULT_PAGE_SIZE;

    public ParsedQueryParams(Map<String, List<String>> queryParams) throws QueryParamException {
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
                    if (FIELD_MAP.containsKey(key))
                        parseFilter(key, val);
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

    private void parseFilter(String key, String val) {
        if (filterFields == null)
            filterFields = new LinkedHashMap<>();
        filterFields.put(FIELD_MAP.get(key), val);
    }

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
            if (FILTER_PARSERS.containsKey(field)) {
                if (FILTER_VALID_VALUES.get(field).contains(value.toUpperCase())) {
                    sb.append(" AND c.").append(field).append(" = ");
                    sb.append(FILTER_PARSERS.get(field).apply(value));
                } else {
                    if (STRICT_QUERY_PARAMS) {
                        throw new QueryParamException(
                                "Invalid value '" + value + "' for '" + field + "'. Valid options: "
                                        + FILTER_VALID_VALUES.get(field));
                    }
                }
            } else {
                sb.append(" AND c.").append(field).append(" = ");
                sb.append("'").append(value).append("'");
            }
        }
        return sb.toString();
    }

    public String getSortClause() {
        return " ORDER BY c." + sortBy + (sortDir == SortStyle.DESCENDING ? " DESC" : " ASC");
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
