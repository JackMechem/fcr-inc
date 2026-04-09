package com.inc.fcr.database;

public record PagesWrapper(
    Object data,
    int currentPage,
    int totalPages,
    long totalItems
) {}
