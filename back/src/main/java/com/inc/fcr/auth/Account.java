package com.inc.fcr.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.inc.fcr.database.SearchField;
import com.inc.fcr.utils.APIEntity;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.EntityController;
import com.inc.fcr.car.Car;
import com.inc.fcr.user.User;
import jakarta.persistence.*;

import javax.annotation.Nullable;
import java.time.Instant;

/**
 * JPA entity representing an authenticated account in the FCR rental system.
 * Can be a staff, admin, user/driver, etc.
 *
 * <p>Maps to the {@code accounts} database table. Stores login information, account access/roll, and user driver information.
 *
 * <p>Has a one-to-many relationship with {@link com.inc.fcr.user.User}.
 * Returns user IDs unless parsing full objects is enabled. </p>
 */
@Entity
@Table(name = "accounts")
public class Account extends APIEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long acctId;
    @Column(nullable = false) @SearchField
    private String name;
    @Column(nullable = false) @SearchField
    private String email;
    @Column(nullable = false)
    private Instant dateCreated;
    private Instant dateEmailConfirmed;
    @OneToOne @JoinColumn(name="userId")
    private User user; // May change to multiple in future
//    private List<User> users = new ArrayList<>();
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AccountRole role;

    // Constructors

    public Account(String name, String email, Instant dateCreated, @Nullable User user, AccountRole role) {
        this.name = name;
        this.email = email;
        this.dateCreated = dateCreated;
        this.user = user;
        this.role = role;
    }

    public Account(long id) throws IllegalAccessException {
        Account a = (Account) DatabaseController.getOne(Account.class, id);
        EntityController.copyFields(a, this);
    }

    public Account() {}

    // Getters

    public long getAcctId() {
        return acctId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public Instant getDateCreated() {
        return dateCreated;
    }

    public Instant getDateEmailConfirmed() {
        return dateEmailConfirmed;
    }

    @JsonIgnore
    public User getUser() {
        return user;
    }
    @JsonProperty("user")
    public Object getUserParse() {
        if (parseFullObjects) {
            user.parseFullObjects = true;
            return user;
        }
        else return user.getUserId();
    }

    public AccountRole getRole() {
        return role;
    }

    // Setters

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setRole(AccountRole role) {
        this.role = role;
    }

    public void setDateEmailConfirmed(Instant dateEmailConfirmed) {
        this.dateEmailConfirmed = dateEmailConfirmed;
    }
}
