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

            GroupBy groupBy = parseGroupBy(ctx);
            String timeUnit = parseTimeUnit(ctx, params);
            String dateFormat = timeUnitFormats.get(timeUnit);

            List<Instant> revenueRange = Arrays.asList( // Range defaults to 4 months ago to now
                    ctx.queryParamAsClass("revenueStartDate", Instant.class).getOrDefault(Instant.now().minusSeconds(10512000)),
                    ctx.queryParamAsClass("revenueEndDate", Instant.class).getOrDefault(Instant.now())
            );
            params.getPotentialParams().put("revenueDate", revenueRange);

            String queryString = "SELECT "+(groupBy.car ? "c AS car, ":"")+"(SUM(GREATEST(1,DATEDIFF(r.dropOffTime, r.pickUpTime)) * c.pricePerDay)) AS revenue" +
                    (groupBy.time ? ", "+timeUnit+"(r.dateBooked) AS timeUnit, DATE_FORMAT(r.dateBooked, '"+dateFormat+"') AS date":"") +
                    " FROM Car c LEFT JOIN Reservation r ON ((r.car = c) AND (r.dateBooked BETWEEN :revenueDate0 AND :revenueDate1 )) " +
                    params.getFilterClause() + " GROUP BY "+ groupBy.clause +" HAVING COUNT(r.id) > 0 ORDER BY revenue DESC"+(groupBy.time ? ", timeUnit DESC":"");

            Session session = HibernateUtil.getSessionFactory().openSession();
            List<?> rows = params.setPotentialParams(session.createQuery(queryString, Map.class)).getResultList();

            selectResultRows(ctx, params, rows, groupBy.car);
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

            GroupBy groupBy = parseGroupBy(ctx);
            String timeUnit = parseTimeUnit(ctx, params);
            String dateFormat = timeUnitFormats.get(timeUnit);

            String queryString = "SELECT "+(groupBy.car ? "c AS car, ":"")+" COUNT(r.id) AS popularity" +
                    (groupBy.time ? ", "+timeUnit+"(r.dateBooked) AS timeUnit, DATE_FORMAT(r.dateBooked, '"+dateFormat+"') AS date":"") +
                    " FROM Car c LEFT JOIN Reservation r ON ((r.car = c) AND (r.dateBooked BETWEEN :popularityDate0 AND :popularityDate1 ))" +
                    params.getFilterClause() + " GROUP BY "+ groupBy.clause +" HAVING COUNT(r.id) > 0 ORDER BY popularity DESC"+(groupBy.time ? ", timeUnit DESC":"");

            Session session = HibernateUtil.getSessionFactory().openSession();
            List<?> rows = params.setPotentialParams(session.createQuery(queryString, Map.class)).getResultList();

            selectResultRows(ctx, params, rows, groupBy.car);
            session.close();

        } catch (Exception e) {
            if (e instanceof QueryParamException) queryParamError(ctx, e);
            else if (e instanceof HibernateException) databaseError(ctx, e);
            else serverError(ctx, e);
        }
    }

    // -- Helper Functions
    // -------------------

    private record GroupBy(boolean car, boolean time, String clause) {}
    /**
     * Determines the GROUP BY clause contents based on whether to group by car and/or time.
     * @param ctx the Javalin context containing query parameters
     * @return the GROUP BY clause string (contents only, not including "GROUP BY")
     * @throws QueryParamException if neither groupByCar nor groupByTime is true
     */
    private static GroupBy parseGroupBy(Context ctx) throws QueryParamException {
        boolean groupByCar = ctx.queryParamAsClass("groupByCar", Boolean.class).getOrDefault(true);
        boolean groupByTime = ctx.queryParamAsClass("groupByTime", Boolean.class).getOrDefault(true);
        if (!groupByCar && !groupByTime) throw new QueryParamException("At least one of 'groupByCar' or 'groupByTime' must be true.");
        String clause = (groupByCar ? "c.vin":"") + (groupByCar && groupByTime ? ", ":"") + (groupByTime ? "timeUnit":"");
        return new GroupBy(groupByCar, groupByTime, clause);
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
    private static void selectResultRows(Context ctx, ParsedQueryParams params, List<?> rows, boolean groupByCar) {
        if (!params.isSelecting() || !groupByCar) ctx.json(rows);
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
