package com.inc.fcr.errorHandling;

// Custom query params validation Exception
// for handling invalid query params
public class QueryParamValidationException extends Exception {
    public QueryParamValidationException(String str) {
        super(str);
    }
}
