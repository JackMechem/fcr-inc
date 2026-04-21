package com.inc.fcr.reviews;

import com.inc.fcr.auth.Account;
import com.inc.fcr.car.Car;

import com.inc.fcr.utils.APIEntity;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.EntityController;
import jakarta.persistence.*;

import java.time.Instant;



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

    public Review(Account account, String title, String bodyOfText, int stars,
                  int rentalDuration, Instant publishedDate) {
        this.account = account;
        this.title = title;
        this.bodyOfText = bodyOfText;
        this.stars = stars;
        this.rentalDuration = rentalDuration;
        this.publishedDate = publishedDate;
    }

    public Review() {}

    public Review(long id) throws IllegalAccessException {
        Review r = (Review) DatabaseController.getOne(Review.class, id);
        EntityController.copyFields(r, this);
    }

    //Getters

    public Long getReviewId() {
        return reviewId;
    }

    public Account getAccount() {
        return account;
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

    public Car getCar() {
        return car;
    }

    public int getRentalDuration() {
        return rentalDuration;
    }

    public Instant getPublishedDate() {
        return publishedDate;
    }

    // Setters

    public void setAccount(Account account) {
        this.account = account;
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
