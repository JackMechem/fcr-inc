package com.inc.fcr.car;
import java.util.List;
import java.util.Map;


public record CarSelectPagesWrapper(List<Map<String, Object>> cars, int currentPage, int totalPages, Long totalItems) {
}
