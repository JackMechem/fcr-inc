package com.inc.fcr.reservation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.car.Car;
import com.inc.fcr.database.ParsedQueryParams;
import com.inc.fcr.errorHandling.QueryParamException;
import com.inc.fcr.utils.HibernateUtil;
import io.javalin.http.Context;
import org.hibernate.HibernateException;
import org.hibernate.Session;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.inc.fcr.errorHandling.ApiErrors.*;

public class StatsController {

    private static final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
    private static final List<String> timeUnits = List.of("day", "week", "month", "year");
    private static final Map<String, String> timeUnitFormats = Map.of(
            "day", "%Y-%m-%d",
            "week", "%Y-%u",
            "month", "%Y-%m",
            "year", "%Y"
    ); // %Y = year, %m = month, %u = week, %d = day

    public static void getRevenue(Context ctx) {
        try {
            var params = new ParsedQueryParams(Car.class, ctx.queryParamMap());

            String groupBy = parseGroupBy(ctx);
            String timeUnit = parseTimeUnit(ctx, params);
            String dateFormat = timeUnitFormats.get(timeUnit);

            List<Instant> revenueRange = Arrays.asList( // Range defaults to 4 months ago to now
                    ctx.queryParamAsClass("revenueStartDate", Instant.class).getOrDefault(Instant.now().minusSeconds(10512000)),
                    ctx.queryParamAsClass("revenueEndDate", Instant.class).getOrDefault(Instant.now())
            );
            params.getPotentialParams().put("revenueDate", revenueRange);

            String queryString = "SELECT c AS car, (SUM(GREATEST(1,DATEDIFF(r.dropOffTime, r.pickUpTime)) * c.pricePerDay)) AS revenue, " +
                    timeUnit + "(r.dateBooked) AS timeUnit, DATE_FORMAT(r.dateBooked, '"+dateFormat+"') AS date" +
                    " FROM Car c LEFT JOIN Reservation r ON ((r.car = c) AND (r.dateBooked BETWEEN :revenueDate0 AND :revenueDate1 )) " +
                    params.getFilterClause() + " GROUP BY "+ groupBy +" HAVING COUNT(r.id) > 0 ORDER BY revenue DESC, timeUnit DESC";

            Session session = HibernateUtil.getSessionFactory().openSession();
            List<?> rows = params.setPotentialParams(session.createQuery(queryString, Map.class)).getResultList();

            selectResultRows(ctx, params, rows);
            session.close();

        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }


    public static void getPopularity(Context ctx) {
        try {
            var ctxParams = new LinkedHashMap<>(ctx.queryParamMap());
            ctxParams.put("sortBy", List.of("popularity")); // Ensure sort by set for param parsing
            var params = new ParsedQueryParams(Car.class, ctxParams);

            String groupBy = parseGroupBy(ctx);
            String timeUnit = parseTimeUnit(ctx, params);
            String dateFormat = timeUnitFormats.get(timeUnit);

            String queryString = "SELECT c AS car, COUNT(r.id) AS popularity, "+timeUnit+"(r.dateBooked) AS timeUnit, DATE_FORMAT(r.dateBooked, '"+dateFormat+"') AS date" +
                    " FROM Car c LEFT JOIN Reservation r ON ((r.car = c) AND (r.dateBooked BETWEEN :popularityDate0 AND :popularityDate1 ))" +
                    params.getFilterClause() + " GROUP BY "+ groupBy +" HAVING COUNT(r.id) > 0 ORDER BY popularity DESC, timeUnit DESC";

            Session session = HibernateUtil.getSessionFactory().openSession();
            List<?> rows = params.setPotentialParams(session.createQuery(queryString, Map.class)).getResultList();

            selectResultRows(ctx, params, rows);
            session.close();

        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    // -- Helper Functions
    // -------------------

    /**
     * Determines the GROUP BY clause contents based on whether to group by car and/or time.
     * @param ctx the Javalin context containing query parameters
     * @return the GROUP BY clause string (contents only, not including "GROUP BY")
     * @throws QueryParamException if neither groupByCar nor groupByTime is true
     */
    private static String parseGroupBy(Context ctx) throws QueryParamException {
        boolean groupByCar = ctx.queryParamAsClass("groupByCar", Boolean.class).getOrDefault(true);
        boolean groupByTime = ctx.queryParamAsClass("groupByTime", Boolean.class).getOrDefault(true);
        if (!groupByCar && !groupByTime) throw new QueryParamException("At least one of 'groupByCar' or 'groupByTime' must be true.");
        return (groupByCar ? "c.vin":"") + (groupByCar && groupByTime ? ", ":"") + (groupByTime ? "timeUnit":"");
    }

    /**
     * Determines the time unit for grouping reservations based on the date range or provided parameter.
     * @param ctx the Javalin context
     * @param params the parsed query parameters
     * @return the time unit string (day, week, month, or year)
     * @throws QueryParamException if the timeUnit parameter is invalid
     */
    private static String parseTimeUnit(Context ctx, ParsedQueryParams params) throws QueryParamException {
        String timeUnit = ctx.queryParam("timeUnit");
        if (timeUnit == null) {
            var popularityRange = (List<Instant>) params.getPotentialParams().get("popularityDate");
            long dayRange = ChronoUnit.DAYS.between(popularityRange.get(0), popularityRange.get(1));
            if (dayRange <= 30) timeUnit = timeUnits.get(0); // day
            else if (dayRange <= 124) timeUnit = timeUnits.get(1); // week
            else if (dayRange <= 365) timeUnit = timeUnits.get(2); // month
            else timeUnit = timeUnits.get(3); // year
        } else if (!timeUnits.contains(timeUnit.toLowerCase())) {
            throw new QueryParamException("Invalid timeUnit value. Supported values: " + timeUnits);
        }
        return timeUnit.toLowerCase();
    }

    /**
     * Processes and JSON returns the query result rows, filtering car fields if select parameters are specified.
     * @param ctx the Javalin context
     * @param params the parsed query parameters
     * @param rows the list of result rows from the query
     */
    private static void selectResultRows(Context ctx, ParsedQueryParams params, List<?> rows) {
        if (!params.isSelecting()) ctx.json(rows);
        else { // Filter down to selected fields
            ctx.json(rows.stream().map(row -> {
                Map<String, Object> map = mapper.convertValue(row, Map.class);
                Map<String, Object> carMap = (Map<String, Object>) map.get("car");
                carMap.keySet().removeIf(k -> !params.getSelectFields().contains(k));
                map.put("car", carMap);
                return map;
            }).toList());
        }
    }
}
