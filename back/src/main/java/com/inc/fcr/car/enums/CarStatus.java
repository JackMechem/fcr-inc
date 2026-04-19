package com.inc.fcr.car.enums;

/**
 * Represents the status of a vehicle.
 *
 * <ul>
 *   <li>{@link #AVAILABLE} - Vehicle currently available</li>
 *   <li>{@link #DISABLED} - Vehicle disabled from display temporarily</li>
 *   <li>{@link #ARCHIVED} - Vehicle disabled from display indefinitely</li>
 *   <li>{@link #LOANED} - Vehicle out on loan with customer</li>
 *   <li>{@link #SERVICE} - Vehicle currently being serviced</li>
 * </ul>
 */
public enum CarStatus {
    /** Vehicle currently available */
    AVAILABLE,
    /** Vehicle disabled from display temporarily */
    DISABLED,
    /** Vehicle disabled from display indefinitely */
    ARCHIVED,
    /** Vehicle out on loan with customer */
    LOANED,
    /** Vehicle currently being serviced */
    SERVICE
}
