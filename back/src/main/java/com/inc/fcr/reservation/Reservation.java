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

@Entity
@Table(name = "stripe_reservations")
public class Reservation extends APIEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reservationId;
    @ManyToOne
    @JoinColumn(name = "vin", nullable = false)
    private Car car;
    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
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

    public Reservation(Car car, User user, List<Payment> payments, Instant pickUpTime, Instant dropOffTime, Instant dateBooked) {
        this.car = car;
        this.user = user;
        this.payments = payments;
        this.pickUpTime = pickUpTime;
        this.dropOffTime = dropOffTime;
        this.dateBooked = dateBooked;
    }

    public Reservation(long id) throws IllegalAccessException {
        Reservation r = (Reservation) DatabaseController.getOne(Reservation.class, id);
        EntityController.copyFields(r, this);
    }

    // Seems not to work/be used by the parsers or hibernate?
    public Reservation(String vin, Long id, List<Long> payments, Instant pickUpTime, Instant dropOffTime, Instant dateBooked) {
        this.car = (Car) DatabaseController.getOne(Car.class, vin);
        this.user = (User) DatabaseController.getOne(User.class, id);
        this.payments = payments.stream().map(p -> (Payment)
                DatabaseController.getOne(Payment.class, p)).toList();
        this.pickUpTime = pickUpTime;
        this.dropOffTime = dropOffTime;
        this.dateBooked = dateBooked;
    }

    public Reservation() {}

    // Methods

    public int getDuration() {
        return (int) ChronoUnit.SECONDS.between(pickUpTime,dropOffTime);
    }
    public int getDurationHours() {
        // 1h = 30m+
        return (getDuration()+1800) / 3600;
    }
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

    public void setPickUpTime(Instant pickUpTime) throws ValidationException {
        if (dropOffTime != null && pickUpTime.isAfter(dropOffTime)) {
            throw new ValidationException("Invalid pick up time: after drop off time");
        }
        this.pickUpTime = pickUpTime;
    }

    public void setDropOffTime(Instant dropOffTime) throws ValidationException {
        if (pickUpTime != null && dropOffTime.isBefore(pickUpTime)) {
            throw new ValidationException("Invalid drop off time: before pick up time");
        }
        this.dropOffTime = dropOffTime;
    }

    public void setTimeRange(Instant pickUpTime, Instant dropOffTime) throws ValidationException {
        if (pickUpTime.isAfter(dropOffTime)) {
            throw new ValidationException("Invalid time range: pick up after drop off");
        }
        this.pickUpTime = pickUpTime;
        this.dropOffTime = dropOffTime;
    }
}
