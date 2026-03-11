package com.inc.fcr.database;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.jooq.DSLContext;
import org.jooq.SQLDialect;
import org.jooq.impl.DSL;

public final class Jooq {

    private static String requireEnv(String key) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing environment variable: " + key);
        }
        return value;
    }

    private static final HikariDataSource DS = buildDataSource();

    private static HikariDataSource buildDataSource() {
        String url = requireEnv("DB_URL");
        String user = requireEnv("DB_USER");
        String password = requireEnv("DB_PASSWORD");

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(user);
        config.setPassword(password);
        config.setMaximumPoolSize(1);
        config.setPoolName("fcr-pool");
        config.setConnectionTimeout(100_000);

        return new HikariDataSource(config);
    }

    private static final DSLContext CTX = DSL.using(DS, SQLDialect.MYSQL);

    private Jooq() {}

    public static DSLContext ctx() {
        return CTX;
    }

    public static void close() {
        DS.close();
    }
}
