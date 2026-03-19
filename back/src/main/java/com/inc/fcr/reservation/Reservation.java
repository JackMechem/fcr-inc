package com.inc.fcr.reservation;

import com.inc.fcr.car.Car;
import com.inc.fcr.payment.Payment;
import com.inc.fcr.user.User;
import jakarta.persistence.*;

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
    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    private User user;
    @ManyToMany
    @JoinTable(name = "reservationPayments",
        joinColumns = @JoinColumn(name = "reservationId"),
        inverseJoinColumns = @JoinColumn(name = "paymentId")
    ) private List<Payment> payments = new ArrayList<>();
    @Column(nullable = false)
    private long pickupTime;
    @Column(nullable = false)
    private long dropOffTime;

    public Reservation(Car car, User user, List<Payment> payments, long pickupTime, long dropOffTime) {
        this.car = car;
        this.user = user;
        this.payments = payments;
        this.pickupTime = pickupTime;
        this.dropOffTime = dropOffTime;
    }

    public Reservation() {
    }

    public int getDuration() {
        return (int) (dropOffTime - pickupTime);
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

    public long getPickupTime() {
        return pickupTime;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public List<Payment> getPayments() {
        return payments;
    }

    public long getDropOffTime() {
        return dropOffTime;
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

    public void setPickupTime(long pickupTime) {
        this.pickupTime = pickupTime;
    }

    public void setDropOffTime(long dropOffTime) {
        this.dropOffTime = dropOffTime;
    }
}
