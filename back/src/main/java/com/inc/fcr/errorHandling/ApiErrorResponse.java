package com.inc.fcr.errorHandling;

// Record for error response body
public record ApiErrorResponse(int status, String error, String message, String fullMessage) {
}
