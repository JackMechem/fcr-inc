package com.inc.fcr.reservation;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.inc.fcr.car.Car;
import com.inc.fcr.errorHandling.ValidationException;
import com.inc.fcr.payment.Payment;
import com.inc.fcr.user.User;
import com.inc.fcr.utils.APIEntity;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.EntityController;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity representing a car reservation in the FCR system.
 *
 * <p>Maps to the {@code stripe_reservations} table. A reservation links a {@link User},
 * a {@link Car}, one or more {@link Payment}s, and a time range (pick-up / drop-off).
 * Payments are associated through the {@code stripe_reservation_payments} join table.</p>
 *
 * <p>Pick-up and drop-off times are validated to ensure pick-up is not after drop-off.
 * Duration helpers convert the time delta into seconds, hours, or days.</p>
 */
@Entity
@Table(name = "stripe_reservations")
public class Reservation extends APIEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reservationId;
    @ManyToOne @JoinColumn(name = "vin", nullable = false)
    private Car car;
    @ManyToOne @JoinColumn(name = "userId", nullable = false)
    private User user;
    @ManyToMany
    @JoinTable(name = "stripe_reservation_payments",
            joinColumns = @JoinColumn(name = "reservationId"),
            inverseJoinColumns = @JoinColumn(name = "paymentId", columnDefinition = "VARCHAR(255)")
    ) private List<Payment> payments = new ArrayList<>();
    @Column(nullable = false)
    private Instant pickUpTime;
    @Column(nullable = false)
    private Instant dropOffTime;
    @Column(nullable = false)
    private Instant dateBooked;

    // Constructors

    /**
     * Full constructor for creating a new reservation with all required associations.
     *
     * @param car         the car being reserved
     * @param user        the user making the reservation
     * @param payments    the list of payments associated with this reservation
     * @param pickUpTime  the scheduled pick-up time (must be before drop-off)
     * @param dropOffTime the scheduled drop-off time
     * @param dateBooked  the timestamp when the reservation was created
     */
    public Reservation(Car car, User user, List<Payment> payments, Instant pickUpTime, Instant dropOffTime, Instant dateBooked) {
        this.car = car;
        this.user = user;
        this.payments = payments;
        this.pickUpTime = pickUpTime;
        this.dropOffTime = dropOffTime;
        this.dateBooked = dateBooked;
    }

    /**
     * Loads an existing reservation from the database by its auto-generated ID.
     *
     * @param id the reservation's primary key
     * @throws IllegalAccessException if reflective field copy fails
     */
    public Reservation(long id) throws IllegalAccessException {
        Reservation r = (Reservation) DatabaseController.getOne(Reservation.class, id);
        EntityController.copyFields(r, this);
    }

    /**
     * Constructor that resolves entity associations from IDs by querying the database.
     *
     * <p><strong>Note:</strong> This constructor does not appear to be used by Hibernate
     * or the JSON parsers. Kept for potential manual construction scenarios.</p>
     *
     * @param vin         the VIN of the car to associate
     * @param id          the user ID to associate
     * @param payments    list of payment primary keys to associate
     * @param pickUpTime  the scheduled pick-up time
     * @param dropOffTime the scheduled drop-off time
     * @param dateBooked  the timestamp when the reservation was created
     */
    public Reservation(String vin, Long id, List<Long> payments, Instant pickUpTime, Instant dropOffTime, Instant dateBooked) {
        this.car = (Car) DatabaseController.getOne(Car.class, vin);
        this.user = (User) DatabaseController.getOne(User.class, id);
        this.payments = payments.stream().map(p -> (Payment)
                DatabaseController.getOne(Payment.class, p)).toList();
        this.pickUpTime = pickUpTime;
        this.dropOffTime = dropOffTime;
        this.dateBooked = dateBooked;
    }

    /** Default no-arg constructor required by JPA/Hibernate and Jackson. */
    public Reservation() {}

    // Methods

    /**
     * Returns the reservation duration in seconds.
     *
     * @return the number of seconds between pick-up and drop-off
     */
    public int getDuration() {
        return (int) ChronoUnit.SECONDS.between(pickUpTime,dropOffTime);
    }
    /**
     * Returns the reservation duration rounded to the nearest hour.
     *
     * <p>Rounding rule: 30 minutes or more counts as a full hour.</p>
     *
     * @return the duration in hours, rounded up at the 30-minute mark
     */
    public int getDurationHours() {
        // 1h = 30m+
        return (getDuration()+1800) / 3600;
    }

    /**
     * Returns the reservation duration rounded to the nearest day.
     *
     * <p>Rounding rule: 6 hours or more counts as a full day.</p>
     *
     * @return the duration in days, rounded up at the 6-hour mark
     */
    public int getDurationDays() {
        // 1 day = 6h+
        return (getDurationHours()+18) / 24;
    }

    // Getters

    @JsonIgnore
    public User getUser() {
        return user;
    }
    @JsonProperty("user")
    public Object getUserParse() {
        if (parseFullObjects) return user;
        else return user.getUserId();
    }

    public Long getReservationId() {
        return reservationId;
    }

    @JsonIgnore
    public List<Payment> getPayments() {
        return payments;
    }
    @JsonProperty("payments")
    public Object getPaymentsParse() {
        if (parseFullObjects) return payments;
        else return payments.stream().map(Payment::getPaymentId).toList();
    }

    public Instant getPickUpTime() {
        return pickUpTime;
    }

    public Instant getDropOffTime() {
        return dropOffTime;
    }

    public Instant getDateBooked() {
        return dateBooked;
    }

    @JsonIgnore
    public Car getCar() {
        return car;
    }
    @JsonProperty("car")
    public Object getCarParse() {
        if (parseFullObjects) return car;
        else return car.getVin();
    }

    // Setters

    public void setCar(Car car) {
        this.car = car;
    }

    public void addPayment(Payment p) {
        payments.add(p);
    }

    /**
     * Sets the pick-up time, validating it is not after the existing drop-off time.
     *
     * @param pickUpTime the new pick-up time
     * @throws ValidationException if {@code pickUpTime} is after the current drop-off time
     */
    public void setPickUpTime(Instant pickUpTime) throws ValidationException {
        if (dropOffTime != null && pickUpTime.isAfter(dropOffTime)) {
            throw new ValidationException("Invalid pick up time: after drop off time");
        }
        this.pickUpTime = pickUpTime;
    }

    /**
     * Sets the drop-off time, validating it is not before the existing pick-up time.
     *
     * @param dropOffTime the new drop-off time
     * @throws ValidationException if {@code dropOffTime} is before the current pick-up time
     */
    public void setDropOffTime(Instant dropOffTime) throws ValidationException {
        if (pickUpTime != null && dropOffTime.isBefore(pickUpTime)) {
            throw new ValidationException("Invalid drop off time: before pick up time");
        }
        this.dropOffTime = dropOffTime;
    }

    /**
     * Atomically sets both pick-up and drop-off times after validating the range is valid.
     *
     * <p>Prefer this over calling {@link #setPickUpTime} and {@link #setDropOffTime}
     * separately when updating both values to avoid intermediate validation failures.</p>
     *
     * @param pickUpTime  the new pick-up time
     * @param dropOffTime the new drop-off time
     * @throws ValidationException if {@code pickUpTime} is after {@code dropOffTime}
     */
    public void setTimeRange(Instant pickUpTime, Instant dropOffTime) throws ValidationException {
        if (pickUpTime.isAfter(dropOffTime)) {
            throw new ValidationException("Invalid time range: pick up after drop off");
        }
        this.pickUpTime = pickUpTime;
        this.dropOffTime = dropOffTime;
    }
}
