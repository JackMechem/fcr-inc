package com.inc.fcr.reservation;

import com.inc.fcr.car.Car;
import com.inc.fcr.errorHandling.ValidationException;
import com.inc.fcr.payment.Payment;
import com.inc.fcr.user.User;
import com.inc.fcr.utils.DatabaseController;
import jakarta.persistence.*;

import java.sql.Time;
import java.time.Duration;
import java.time.LocalDateTime;
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
    private LocalDateTime pickupTime;
    @Column(nullable = false)
    private LocalDateTime dropOffTime;
    @Column(nullable = false)
    private LocalDateTime duration;

    public Reservation(Car car, User user, List<Payment> payments, LocalDateTime pickupTime, LocalDateTime dropOffTime) {
        this.car = car;
        this.user = user;
        this.payments = payments;
        this.pickupTime = pickupTime;
        this.dropOffTime = dropOffTime;
    }

    // Seems not to work/be used by the parsers or hibernate?
    public Reservation(String vin, Long id, List<Long> payments, LocalDateTime pickupTime, LocalDateTime dropOffTime) {
        this.car = (Car) DatabaseController.getOne(Car.class, vin);
        this.user = (User) DatabaseController.getOne(User.class, id);
        this.payments = payments.stream().map(p -> (Payment)
                DatabaseController.getOne(Payment.class, p)).toList();
        this.pickupTime = pickupTime;
        this.dropOffTime = dropOffTime;
    }

    public Reservation() {
    }

    public Duration getDuration(LocalDateTime pickupTime, LocalDateTime dropOffTime) {

        Duration duration = Duration.between(pickupTime, dropOffTime);

        return duration;
    }

    /**
    public int getDurationHours() {
        // 1h = 30m+
        return (getDuration()+1800) / 3600;
    }
    public int getDurationDays() {
        // 1 day = 6h+
        return (getDurationHours()+18) / 24;
    }
    **/

    public Payment getPayment(long paymentId) {
        return payments.stream().filter(p -> p.getPaymentId() == paymentId).findFirst().orElse(null);
    }

    // Getters & Setters

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public Car getCar() {
        return car;
    }

    public void setCar(Car car) {
        this.car = car;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<Payment> getPayments() {
        return payments;
    }

    public void setPayments(List<Payment> payments) {
        this.payments = payments;
    }

    public LocalDateTime getPickupTime() {
        return pickupTime;
    }

    public void setPickupTime(LocalDateTime pickupTime) throws ValidationException {

        if(pickupTime.isBefore(LocalDateTime.now()) || pickupTime.isAfter(dropOffTime)) {

            throw new ValidationException("You Cannot Pickup At This Time" + LocalDateTime.now());

        }

        this.pickupTime = pickupTime;

    }

    public LocalDateTime getDropOffTime() {
        return dropOffTime;
    }

    public void setDropOffTime(LocalDateTime dropOffTime) {
        this.dropOffTime = dropOffTime;
    }
}
