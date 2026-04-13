package com.inc.fcr.reservation;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.inc.fcr.car.Car;
import com.inc.fcr.errorHandling.ValidationException;
import com.inc.fcr.payment.Payment;
import com.inc.fcr.user.User;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.EntityController;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stripe_reservations")
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reservationId;
    @ManyToOne @JsonBackReference("car-reservation")
    @JoinColumn(name = "vin", nullable = false)
    private Car car;
    @ManyToOne @JsonBackReference("user-reservation")
    @JoinColumn(name = "userId", nullable = false)
    private User user;
    @ManyToMany @JsonBackReference("payment-reservation")
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

    public Payment getPayment(String paymentId) {
        return payments.stream().filter(p -> p.getPaymentId().equals(paymentId)).findFirst().orElse(null);
    }

    // Getters

    public User getUser() {
        return user;
    }
    public long getUserId() {
        return user.getUserId();
    }

    public Long getReservationId() {
        return reservationId;
    }

    public List<Payment> getPayments() {
        return payments;
    }
    public List<String> getPaymentIds() {
        return payments.stream().map(Payment::getPaymentId).toList();
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
    public String getCarVin() {
        return car.getVin();
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
