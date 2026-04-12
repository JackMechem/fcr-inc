package com.inc.fcr.payment;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.inc.fcr.car.Car;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.user.User;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.EntityController;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;
    @ManyToMany(mappedBy = "payments") @JsonManagedReference
    private List<Reservation> reservations = new ArrayList<>();
    @Column(nullable = false)
    private double totalAmount;
    @Column(nullable = false)
    private double amountPaid;
    @Column(nullable = false)
    private Instant date;
    @Enumerated(EnumType.STRING)
    private PaymentType paymentType;

    public Payment(double totalAmount, double amountPaid, Instant date, PaymentType paymentType) {
        this.totalAmount = totalAmount;
        this.amountPaid = amountPaid;
        this.date = date;
        this.paymentType = paymentType;
    }

    public Payment(long id) throws IllegalAccessException {
        Payment p = (Payment) DatabaseController.getOne(Payment.class, id);
        EntityController.copyFields(p, this);
    }

    public Payment() {}

    public boolean isPaid() {
        return amountPaid >= totalAmount;
    }

    @JsonIgnore
    public List<User> getUsers() {
        return reservations.stream().map(Reservation::getUser).toList();
    }

    @JsonIgnore
    public List<Car> getCars() {
        return reservations.stream().map(Reservation::getCar).toList();
    }


    public Long getPaymentId() {
        return paymentId;
    }

    public List<Reservation> getReservations() {
        return reservations;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public double getAmountPaid() {
        return amountPaid;
    }

    public Instant getDate() {
        return date;
    }

    public PaymentType getPaymentType() {
        return paymentType;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public void setAmountPaid(double amountPaid) {
        this.amountPaid = amountPaid;
    }

    public void setPaymentType(PaymentType paymentType) {
        this.paymentType = paymentType;
    }

    public void setReservations(List<Reservation> reservations) {
        this.reservations = reservations;
    }
}
