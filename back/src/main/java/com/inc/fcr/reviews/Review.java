package com.inc.fcr.reviews;

import com.inc.fcr.car.Car;
import com.inc.fcr.user.User;

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
    @ManyToOne @JoinColumn(name = "userId", nullable = false)
    private User user;
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

    public Review(User user, String title, String bodyOfText, int stars,
                  int rentalDuration, Instant publishedDate) {
        this.user = user;
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

    public User getUser() {
        return user;
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

    public void setUser(User user) {
        this.user = user;
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
