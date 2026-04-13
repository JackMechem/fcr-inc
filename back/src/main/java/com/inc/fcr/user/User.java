package com.inc.fcr.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.inc.fcr.database.Converters;
import com.inc.fcr.database.SearchField;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.EntityController;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long userId;
    @Column(nullable = false) @SearchField
    private String firstName;
    @Column(nullable = false) @SearchField
    private String lastName;
    @Column(nullable = false) @SearchField
    private String email;
    @Column(nullable = false)
    private String phoneNumber;
    @Convert(converter = Converters.JsonAddressConverter.class)
    @Column(columnDefinition = "json", nullable = false)
    private Address address;
    @Convert(converter = Converters.JsonDriversLicenseConverter.class)
    @Column(columnDefinition = "json", nullable = false)
    private DriversLicense driversLicense;
    @OneToMany(mappedBy = "user") @JsonManagedReference("user-reservation") @JsonIgnore
    private List<Reservation> reservations = new ArrayList<>();
    @Column(nullable = false)
    private Instant dateCreated;

    // Constructors

    public User(String firstName, String lastName, String email, String phoneNumber, Address address, DriversLicense driversLicense, Instant dateCreated) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.driversLicense = driversLicense;
        this.dateCreated = dateCreated;
    }

    public User(long id) throws IllegalAccessException {
        User u = (User) DatabaseController.getOne(User.class, id);
        EntityController.copyFields(u, this);
    }

    public User() {}

    // Getters & Setters

    public long getUserId() {
        return userId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    public DriversLicense getDriversLicense() {
        return driversLicense;
    }

    public void setDriversLicense(DriversLicense driversLicense) {
        this.driversLicense = driversLicense;
    }

    public Instant getDateCreated() {
        return dateCreated;
    }

    @JsonIgnore
    public List<Reservation> getReservations() {
        return reservations;
    }
    public List<Long> getReservationIds() {
        return reservations.stream().map(Reservation::getReservationId).toList();
    }
}

