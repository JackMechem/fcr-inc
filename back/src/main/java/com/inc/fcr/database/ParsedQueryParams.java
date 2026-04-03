package com.inc.fcr.database;

import com.inc.fcr.car.enums.*;
import com.inc.fcr.errorHandling.QueryParamException;

import java.util.*;
import java.util.stream.Collectors;

public class ParsedQueryParams {

    private static final Set<String> ALLOWED_SELECT_FIELDS = Set.of(
            "vin",
            "make",
            "model",
            "modelYear",
            "cylinders",
            "gears",
            "horsepower",
            "torque",
            "seats",
            "pricePerDay",
            "mpg",
            "transmission",
            "drivetrain",
            "engineLayout",
            "fuel",
            "bodyType",
            "roofType",
            "vehicleClass"
    );

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "vin",
            "make",
            "model",
            "modelYear",
            "horsepower",
            "torque",
            "seats",
            "pricePerDay",
            "mpg",
            "cylinders",
            "gears"
    );

    private int page;
    private int pageSize;

    private List<String> selectFields;
    private String sortBy;
    private String sortDir;

    // generic search
    private String q;

    // partial text filters
    private String make;
    private String model;
    private String description;

    // exact filters
    private String vinFilter;
    private Integer modelYear;
    private TransmissionType transmission;
    private Drivetrain drivetrain;
    private EngineLayout engineLayout;
    private FuelType fuel;
    private BodyType bodyType;
    private RoofType roofType;
    private VehicleClass vehicleClass;

    // numeric ranges
    private Double minPricePerDay;
    private Double maxPricePerDay;
    private Integer minHorsepower;
    private Integer maxHorsepower;
    private Integer minSeats;
    private Integer maxSeats;
    private Double minMpg;
    private Double maxMpg;
    private Integer minModelYear;
    private Integer maxModelYear;

    public ParsedQueryParams(Map<String, List<String>> queryParamMap) throws QueryParamException {
        this.page = parseInt(queryParamMap, "page", 1);
        this.pageSize = parseInt(queryParamMap, "pageSize", 10);

        if (page < 1) {
            throw new QueryParamException("page must be >= 1");
        }
        if (pageSize < 1) {
            throw new QueryParamException("pageSize must be >= 1");
        }

        this.selectFields = parseSelectFields(queryParamMap);
        this.sortBy = parseOptionalString(queryParamMap, "sortBy");
        this.sortDir = parseOptionalString(queryParamMap, "sortDir");

        validateSort();

        this.q = parseOptionalString(queryParamMap, "q");

        this.make = parseOptionalString(queryParamMap, "make");
        this.model = parseOptionalString(queryParamMap, "model");
        this.description = parseOptionalString(queryParamMap, "description");

        this.modelYear = parseOptionalInteger(queryParamMap, "modelYear");

        this.transmission = parseOptionalEnum(queryParamMap, "transmission", TransmissionType.class);
        this.drivetrain = parseOptionalEnum(queryParamMap, "drivetrain", Drivetrain.class);
        this.engineLayout = parseOptionalEnum(queryParamMap, "engineLayout", EngineLayout.class);
        this.fuel = parseOptionalEnum(queryParamMap, "fuel", FuelType.class);
        this.bodyType = parseOptionalEnum(queryParamMap, "bodyType", BodyType.class);
        this.roofType = parseOptionalEnum(queryParamMap, "roofType", RoofType.class);
        this.vehicleClass = parseOptionalEnum(queryParamMap, "vehicleClass", VehicleClass.class);

        this.minPricePerDay = parseOptionalDouble(queryParamMap, "minPricePerDay");
        this.maxPricePerDay = parseOptionalDouble(queryParamMap, "maxPricePerDay");

        this.minHorsepower = parseOptionalInteger(queryParamMap, "minHorsepower");
        this.maxHorsepower = parseOptionalInteger(queryParamMap, "maxHorsepower");

        this.minSeats = parseOptionalInteger(queryParamMap, "minSeats");
        this.maxSeats = parseOptionalInteger(queryParamMap, "maxSeats");

        this.minMpg = parseOptionalDouble(queryParamMap, "minMpg");
        this.maxMpg = parseOptionalDouble(queryParamMap, "maxMpg");

        this.minModelYear = parseOptionalInteger(queryParamMap, "minModelYear");
        this.maxModelYear = parseOptionalInteger(queryParamMap, "maxModelYear");

        validateRanges();
    }

    private void validateSort() throws QueryParamException {
        if (sortBy != null && !ALLOWED_SORT_FIELDS.contains(sortBy)) {
            throw new QueryParamException("Invalid sortBy field: " + sortBy);
        }

        if (sortDir == null) {
            sortDir = "asc";
        } else if (!sortDir.equalsIgnoreCase("asc") && !sortDir.equalsIgnoreCase("desc")) {
            throw new QueryParamException("sortDir must be 'asc' or 'desc'");
        }
    }

    private void validateRanges() throws QueryParamException {
        validateMinMax(minPricePerDay, maxPricePerDay, "pricePerDay");
        validateMinMax(minHorsepower, maxHorsepower, "horsepower");
        validateMinMax(minSeats, maxSeats, "seats");
        validateMinMax(minMpg, maxMpg, "mpg");
        validateMinMax(minModelYear, maxModelYear, "modelYear");

        if (modelYear != null && (minModelYear != null || maxModelYear != null)) {
            throw new QueryParamException("Use either modelYear or minModelYear/maxModelYear, not both");
        }
    }

    private <T extends Number & Comparable<T>> void validateMinMax(T min, T max, String field) throws QueryParamException {
        if (min != null && max != null && min.compareTo(max) > 0) {
            throw new QueryParamException("min" + capitalize(field) + " cannot be greater than max" + capitalize(field));
        }
    }

    private String capitalize(String value) {
        if (value == null || value.isEmpty()) return value;
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    private List<String> parseSelectFields(Map<String, List<String>> queryParamMap) throws QueryParamException {
        String raw = parseOptionalString(queryParamMap, "select");
        if (raw == null) return null;

        List<String> fields = Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());

        if (fields.isEmpty()) {
            throw new QueryParamException("select cannot be empty");
        }

        for (String field : fields) {
            if (!ALLOWED_SELECT_FIELDS.contains(field)) {
                throw new QueryParamException("Invalid select field: " + field);
            }
        }

        return fields;
    }

    private String parseOptionalString(Map<String, List<String>> queryParamMap, String key) {
        List<String> values = queryParamMap.get(key);
        if (values == null || values.isEmpty()) return null;

        String value = values.get(0);
        if (value == null) return null;

        value = value.trim();
        return value.isEmpty() ? null : value;
    }

    private int parseInt(Map<String, List<String>> queryParamMap, String key, int defaultValue) throws QueryParamException {
        String value = parseOptionalString(queryParamMap, key);
        if (value == null) return defaultValue;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            throw new QueryParamException("Invalid integer for " + key + ": " + value);
        }
    }

    private Integer parseOptionalInteger(Map<String, List<String>> queryParamMap, String key) throws QueryParamException {
        String value = parseOptionalString(queryParamMap, key);
        if (value == null) return null;
        try {
            return Integer.valueOf(value);
        } catch (NumberFormatException e) {
            throw new QueryParamException("Invalid integer for " + key + ": " + value);
        }
    }

    private Double parseOptionalDouble(Map<String, List<String>> queryParamMap, String key) throws QueryParamException {
        String value = parseOptionalString(queryParamMap, key);
        if (value == null) return null;
        try {
            return Double.valueOf(value);
        } catch (NumberFormatException e) {
            throw new QueryParamException("Invalid decimal for " + key + ": " + value);
        }
    }

    private <E extends Enum<E>> E parseOptionalEnum(
            Map<String, List<String>> queryParamMap,
            String key,
            Class<E> enumClass
    ) throws QueryParamException {
        String value = parseOptionalString(queryParamMap, key);
        if (value == null) return null;

        try {
            return Enum.valueOf(enumClass, value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new QueryParamException("Invalid value for " + key + ": " + value);
        }
    }

    public void printParams() {
        System.out.println("ParsedQueryParams {");
        System.out.println("  page=" + page);
        System.out.println("  pageSize=" + pageSize);
        System.out.println("  selectFields=" + selectFields);
        System.out.println("  sortBy=" + sortBy);
        System.out.println("  sortDir=" + sortDir);
        System.out.println("  q=" + q);
        System.out.println("  make=" + make);
        System.out.println("  model=" + model);
        System.out.println("  description=" + description);
        System.out.println("  vinFilter=" + vinFilter);
        System.out.println("  modelYear=" + modelYear);
        System.out.println("  minModelYear=" + minModelYear);
        System.out.println("  maxModelYear=" + maxModelYear);
        System.out.println("  transmission=" + transmission);
        System.out.println("  drivetrain=" + drivetrain);
        System.out.println("  engineLayout=" + engineLayout);
        System.out.println("  fuel=" + fuel);
        System.out.println("  bodyType=" + bodyType);
        System.out.println("  roofType=" + roofType);
        System.out.println("  vehicleClass=" + vehicleClass);
        System.out.println("  minPricePerDay=" + minPricePerDay);
        System.out.println("  maxPricePerDay=" + maxPricePerDay);
        System.out.println("  minHorsepower=" + minHorsepower);
        System.out.println("  maxHorsepower=" + maxHorsepower);
        System.out.println("  minSeats=" + minSeats);
        System.out.println("  maxSeats=" + maxSeats);
        System.out.println("  minMpg=" + minMpg);
        System.out.println("  maxMpg=" + maxMpg);
        System.out.println("}");
    }

    public int getPage() {
        return page;
    }

    public int getPageSize() {
        return pageSize;
    }

    public List<String> getSelectFields() {
        return selectFields;
    }

    public String getSortBy() {
        return sortBy;
    }

    public String getSortDir() {
        return sortDir;
    }

    public String getQ() {
        return q;
    }

    public String getMake() {
        return make;
    }

    public String getModel() {
        return model;
    }

    public String getDescription() {
        return description;
    }

    public String getVinFilter() {
        return vinFilter;
    }

    public void setVinFilter(String vinFilter) {
        this.vinFilter = vinFilter;
    }

    public Integer getModelYear() {
        return modelYear;
    }

    public TransmissionType getTransmission() {
        return transmission;
    }

    public Drivetrain getDrivetrain() {
        return drivetrain;
    }

    public EngineLayout getEngineLayout() {
        return engineLayout;
    }

    public FuelType getFuel() {
        return fuel;
    }

    public BodyType getBodyType() {
        return bodyType;
    }

    public RoofType getRoofType() {
        return roofType;
    }

    public VehicleClass getVehicleClass() {
        return vehicleClass;
    }

    public Double getMinPricePerDay() {
        return minPricePerDay;
    }

    public Double getMaxPricePerDay() {
        return maxPricePerDay;
    }

    public Integer getMinHorsepower() {
        return minHorsepower;
    }

    public Integer getMaxHorsepower() {
        return maxHorsepower;
    }

    public Integer getMinSeats() {
        return minSeats;
    }

    public Integer getMaxSeats() {
        return maxSeats;
    }

    public Double getMinMpg() {
        return minMpg;
    }

    public Double getMaxMpg() {
        return maxMpg;
    }

    public Integer getMinModelYear() {
        return minModelYear;
    }

    public Integer getMaxModelYear() {
        return maxModelYear;
    }
}