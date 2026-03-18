package com.inc.fcr.reservation;

import com.inc.fcr.car.Car;
import com.inc.fcr.payment.Payment;
import com.inc.fcr.user.User;
import jakarta.persistence.*;

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
    @ManyToOne
    @JoinColumn(name = "paymentId", nullable = false)
    private Payment payment;
    @Column(nullable = false)
    private long pickupTime;
    @Column(nullable = false)
    private long dropOffTime;

    public Reservation(Car car, User user, Payment payment, long pickupTime, long dropOffTime) {
        this.car = car;
        this.user = user;
        this.payment = payment;
        this.pickupTime = pickupTime;
        this.dropOffTime = dropOffTime;
    }

    public Reservation() {
    }

    public User getUser() {
        return user;
    }

    public long getPickupTime() {
        return pickupTime;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public Payment getPayment() {
        return payment;
    }

    public long getDropOffTime() {
        return dropOffTime;
    }

    public Car getCar() {
        return car;
    }

    public void setPickupTime(long pickupTime) {
        this.pickupTime = pickupTime;
    }

    public void setDropOffTime(long dropOffTime) {
        this.dropOffTime = dropOffTime;
    }
}
