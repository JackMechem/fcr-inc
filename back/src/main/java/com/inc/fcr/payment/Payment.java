package com.inc.fcr.payment;

import com.inc.fcr.car.Car;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.user.User;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;
    @OneToMany(mappedBy = "payment")
    private List<Reservation> reservations;
    @Column(nullable = false)
    private double totalAmount;
    @Column(nullable = false)
    private double amountPaid;
    @Column(nullable = false)
    private long date;
    @Enumerated(EnumType.STRING)
    private PaymentType paymentType;

    public Payment(List<Reservation> reservations, double totalAmount, double amountPaid, long date, PaymentType paymentType) {
        this.reservations = reservations;
        this.totalAmount = totalAmount;
        this.amountPaid = amountPaid;
        this.date = date;
        this.paymentType = paymentType;
    }

    public Payment() {}

    public boolean isPaid() {
        return amountPaid >= totalAmount;
    }

    public List<User> getUsers() {
        return reservations.stream().map(Reservation::getUser).toList();
    }

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

    public long getDate() {
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
}
