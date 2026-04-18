package com.inc.fcr.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.inc.fcr.database.Converters;
import com.inc.fcr.database.SearchField;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.reviews.Review;
import com.inc.fcr.utils.APIEntity;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.EntityController;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity representing a registered user in the FCR rental system.
 *
 * <p>Maps to the {@code stripe_users} database table. Stores personal information,
 * contact details, address, and driver's license data. Complex value objects
 * ({@link Address}, {@link DriversLicense}) are serialized as JSON via
 * {@link com.inc.fcr.database.Converters}.</p>
 *
 * <p>Has a one-to-many relationship with {@link com.inc.fcr.reservation.Reservation}.
 * The reservations list is excluded from JSON serialization via {@code @JsonIgnore};
 * unless parsing full objects is enabled, otherwise returns ID. </p>
 */
@Entity
@Table(name = "stripe_users")
public class User extends APIEntity {
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
    @OneToMany(mappedBy = "reviewId") @JsonIgnore
    private List<Review> reviews = new ArrayList<>();
    @Column(nullable = false)
    private Instant dateCreated;

    // Constructors

    /**
     * Full constructor for creating a new user with all required fields.
     *
     * @param firstName      the user's first name
     * @param lastName       the user's last name
     * @param email          the user's email address (must be unique)
     * @param phoneNumber    the user's phone number
     * @param address        the user's physical address
     * @param driversLicense the user's driver's license information
     * @param dateCreated    the timestamp when the account was created
     */
    public User(String firstName, String lastName, String email, String phoneNumber, Address address, DriversLicense driversLicense, Instant dateCreated) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.driversLicense = driversLicense;
        this.dateCreated = dateCreated;
    }

    /**
     * Loads an existing user from the database by ID and copies its fields into this instance.
     *
     * @param id the user's auto-generated primary key
     * @throws IllegalAccessException if reflective field copy fails
     */
    public User(long id) throws IllegalAccessException {
        User u = (User) DatabaseController.getOne(User.class, id);
        EntityController.copyFields(u, this);
    }

    /** Default no-arg constructor required by JPA/Hibernate and Jackson. */
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

    /**
     * Returns the IDs of all reservations associated with this user.
     *
     * <p>Use this instead of {@link #getReservations()} when only IDs are needed,
     * as the full list is excluded from JSON serialization unless parsing full objects is enabled. </p>
     * @return a list of reservation IDs or objects
     */

    @JsonProperty("reservations")
    public Object getReservationsParse() {
        if (parseFullObjects) return reservations;
        else return reservations.stream().map(Reservation::getReservationId).toList();
    }

    @JsonIgnore
    public List<Review> getReviews() { return reviews; }
    @JsonProperty("reviews")
    public Object getReviewsParse() {
        if(parseFullObjects) return reviews;
        else return reviews.stream().map(Review::getReviewId).toList();
    }
}

