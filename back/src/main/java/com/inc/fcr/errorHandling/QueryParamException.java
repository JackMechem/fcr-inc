package com.inc.fcr.errorHandling;

// Custom query params validation Exception
// for handling invalid query params
public class QueryParamException extends Exception {
    public QueryParamException(String str) {
        super(str);
    }
}
