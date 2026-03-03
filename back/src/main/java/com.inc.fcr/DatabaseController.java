package com.inc.fcr;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseController {
    private static final String URL = "jdbc:mysql://localhost:PORT#/databaseNAME";
    private static final String USER = "";
    private static final String PASSWORD = "";

    private final Connection conn;

    public DatabaseController() throws SQLException {
        this.conn = DriverManager.getConnection(URL, USER, PASSWORD);
    }

    // Car Database Methods

    // Reservation Database Methods

    // Account Database Methods
}
