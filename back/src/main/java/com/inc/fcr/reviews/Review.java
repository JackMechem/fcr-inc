package com.inc.fcr.reviews;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.inc.fcr.auth.Account;
import com.inc.fcr.car.Car;

import com.inc.fcr.utils.APIEntity;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.EntityController;
import jakarta.persistence.*;

import java.time.Instant;

/**
 * JPA entity representing a customer post rental review of their experience with the vehicle.
 *
 * <p>Maps to the {@code cars} database table.
 *
 */

@Entity
@Table(name = "reviews")
public class Review extends APIEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reviewId;
    @ManyToOne @JoinColumn(name = "acctId", nullable = false)
    private Account account;
    @Column(nullable = false)
    private String title;
    private String bodyOfText;
    @Column(nullable = false)
    private int stars;
    @ManyToOne @JoinColumn(name = "vin", nullable = false)
    private Car car;
    private int rentalDuration;
    @Column(nullable = false)
    private Instant publishedDate;

    // Constructors
    /**
     * Loads an existing review from the review database by userID and copies its fields into this instance.
     *
     * @param account the user account
     * @param title review title
     * @param bodyOfText text field for user to type main thoughts ("This car was an amazing experience! I had so much fun.")
     * @param stars rating system 1-5
     * @param rentalDuration amount of time rented vehicle
     * @param publishedDate time-stamp of review
     */
    public Review(Account account, String title, String bodyOfText, int stars,
                  int rentalDuration, Instant publishedDate) {
        this.account = account;
        this.title = title;
        this.bodyOfText = bodyOfText;
        this.stars = stars;
        this.rentalDuration = rentalDuration;
        this.publishedDate = publishedDate;
    }

    /** Default no-arg constructor required by JPA/Hibernate. */
    public Review() {}

    public Review(long id) throws IllegalAccessException {
        Review r = (Review) DatabaseController.getOne(Review.class, id);
        EntityController.copyFields(r, this);
    }

    //Getters

    public Long getReviewId() {
        return reviewId;
    }

    @JsonIgnore
    public Account getAccount() {
        return account;
    }

    @JsonProperty("account")
    public Object getAccountParse() {
        if (parseFullObjects) return account;
        else return account.getAcctId();
    }

    public String getTitle() {
        return title;
    }

    public String getBodyOfText() {
        return bodyOfText;
    }

    public int getStars() {
        return stars;
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

    public int getRentalDuration() {
        return rentalDuration;
    }

    public Instant getPublishedDate() {
        return publishedDate;
    }

    // Setters

    @JsonIgnore
    public void setAccount(Account account) {
        this.account = account;
    }

    @JsonSetter("account")
    public void setAccountById(long id) {
        this.account = (Account) DatabaseController.getOne(Account.class, id);
    }

    @JsonSetter("car")
    public void setCarByVin(String vin) {
        this.car = (Car) DatabaseController.getOne(Car.class, vin);
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setBodyOfText(String bodyOfText) {
        this.bodyOfText = bodyOfText;
    }

    public void setStars(int stars) {
        this.stars = stars;
    }

    public void setRentalDuration(int rentalDuration) {
        this.rentalDuration = rentalDuration;
    }

    public void setPublishedDate(Instant publishedDate) {
        this.publishedDate = publishedDate;
    }

}
