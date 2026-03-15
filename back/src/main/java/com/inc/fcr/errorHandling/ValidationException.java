package com.inc.fcr.errorHandling;

// Custom data validation exception to be used
//   when validating data in setters, etc.
public class ValidationException extends Exception {
    public ValidationException(String str) {
        super(str);
    }
}
