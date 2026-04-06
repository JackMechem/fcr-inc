package com.inc.fcr.reservation;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.inc.fcr.car.Car;
import com.inc.fcr.errorHandling.ValidationException;
import com.inc.fcr.payment.Payment;
import com.inc.fcr.user.User;
import com.inc.fcr.utils.DatabaseController;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reservations")
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reservationId;
    @ManyToOne
    @JoinColumn(name = "vin", nullable = false)
    private Car car;
    @ManyToOne @JsonBackReference
    @JoinColumn(name = "userId", nullable = false)
    private User user;
    @ManyToMany
    @JoinTable(name = "reservationPayments",
            joinColumns = @JoinColumn(name = "reservationId"),
            inverseJoinColumns = @JoinColumn(name = "paymentId")
    ) private List<Payment> payments = new ArrayList<>();
    @Column(nullable = false)
    private Instant pickUpTime;
    @Column(nullable = false)
    private Instant dropOffTime;
    @Column(nullable = false)
    private Instant dateBooked;

    public Reservation(Car car, User user, List<Payment> payments, Instant pickUpTime, Instant dropOffTime, Instant dateBooked) {
        this.car = car;
        this.user = user;
        this.payments = payments;
        this.pickUpTime = pickUpTime;
        this.dropOffTime = dropOffTime;
        this.dateBooked = dateBooked;
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

    public Payment getPayment(long paymentId) {
        return payments.stream().filter(p -> p.getPaymentId() == paymentId).findFirst().orElse(null);
    }

    // Getters & Setters
    public User getUser() {
        return user;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public List<Payment> getPayments() {
        return payments;
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

    public Car getCar() {
        return car;
    }

    public void setCar(Car car) {
        this.car = car;
    }

    public void addPayment(Payment p) {
        payments.add(p);
    }

    public void setPickUpTime(Instant pickUpTime) throws ValidationException {
        if (pickUpTime.isAfter(dropOffTime)) {
            throw new ValidationException("Invalid pick up time: after drop off time");
        }
        this.pickUpTime = pickUpTime;
    }

    public void setDropOffTime(Instant dropOffTime) throws ValidationException {
        if (dropOffTime.isBefore(pickUpTime)) {
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
