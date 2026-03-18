package com.inc.fcr.car;

import java.util.List;

public record CarPagesWrapper(
    Object cars,
    int currentPage,
    int totalPages,
    long totalItems
) {}
