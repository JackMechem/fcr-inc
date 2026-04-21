package com.inc.fcr.payment;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.inc.fcr.car.Car;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.user.User;
import com.inc.fcr.utils.APIEntity;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.EntityController;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity representing a payment record in the FCR rental system.
 *
 * <p>Maps to the {@code stripe_payments} table. The primary key ({@code paymentId}) is
 * the Stripe session or payment-intent ID, not an auto-generated value.</p>
 *
 * <p>Has a many-to-many relationship with {@link com.inc.fcr.reservation.Reservation}
 * through the {@code stripe_reservation_payments} join table.</p>
 */
@Entity
@Table(name = "stripe_payments")
public class Payment extends APIEntity {

    @Id
    @Column(length = 255)
    private String paymentId;
    @ManyToMany(mappedBy = "payments") @JsonManagedReference("payment-reservation") @JsonIgnore
    private List<Reservation> reservations = new ArrayList<>();
    @Column(nullable = false)
    private double totalAmount;
    @Column(nullable = false)
    private double amountPaid;
    @Column(nullable = false)
    private Instant date;
    @Enumerated(EnumType.STRING)
    private PaymentType paymentType;

    // Constructors

    /**
     * Creates a new payment record with the specified amounts and type.
     *
     * @param totalAmount the full amount due in USD
     * @param amountPaid  the amount actually paid in USD
     * @param date        the timestamp when the payment was recorded
     * @param paymentType the method of payment
     */
    public Payment(double totalAmount, double amountPaid, Instant date, PaymentType paymentType) {
        this.totalAmount = totalAmount;
        this.amountPaid = amountPaid;
        this.date = date;
        this.paymentType = paymentType;
    }

    /**
     * Loads an existing payment from the database by its Stripe payment ID.
     *
     * @param id the Stripe payment/session ID (primary key)
     * @throws IllegalAccessException if reflective field copy fails
     */
    public Payment(String id) throws IllegalAccessException {
        Payment p = (Payment) DatabaseController.getOne(Payment.class, id);
        EntityController.copyFields(p, this);
    }

    /** Default no-arg constructor required by JPA/Hibernate and Jackson. */
    public Payment() {}

    // Methods

    /**
     * Returns whether the full amount has been collected.
     *
     * @return {@code true} if {@code amountPaid >= totalAmount}
     */
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

    // Getters

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    @JsonIgnore
    public List<Reservation> getReservations() {
        return reservations;
    }
    @JsonProperty("reservations")
    public Object getReservationsParse() {
        if (parseFullObjects) return reservations;
        else return reservations.stream().map(Reservation::getReservationId).toList();
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

    // Setters

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public void setAmountPaid(double amountPaid) {
        this.amountPaid = amountPaid;
    }

    public void setPaymentType(PaymentType paymentType) {
        this.paymentType = paymentType;
    }

    @JsonProperty("reservations")
    public void setReservations(List<Reservation> reservations) {
        this.reservations = reservations;
    }
}
