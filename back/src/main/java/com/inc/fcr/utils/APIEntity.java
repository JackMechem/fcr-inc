package com.inc.fcr.utils;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Transient;

/**
 * Abstract parent class to all API entities
 */
public abstract class APIEntity {
    /**
     * Controls if ObjectMapper returns full objects or only their IDs by default on compatible entities
     */
    @Transient @JsonIgnore
    public boolean parseFullObjects = false;
}
