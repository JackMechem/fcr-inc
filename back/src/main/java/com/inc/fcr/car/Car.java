package com.inc.fcr.car;

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
import com.inc.fcr.errorHandling.*;
import com.inc.fcr.car.enums.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity representing a rental car in the FCR inventory.
 *
 * <p>Maps to the {@code cars} database table. Contains full vehicle specifications
 * including performance data, pricing, enumerations for drivetrain/body/fuel types,
 * and lists of feature tags and image URLs stored as JSON columns.</p>
 *
 * <p>Validation is enforced in setters: numeric fields (year, cylinders, horsepower,
 * etc.) throw {@link com.inc.fcr.errorHandling.ValidationException} when out of range.</p>
 *
 * <p>Fields annotated with {@link com.inc.fcr.database.SearchField} are included in
 * the full-text {@code search} query parameter.</p>
 */

@Entity
@Table(name = "cars")
public class Car extends APIEntity {

    @Id
    @Column(length = 17)
    private String vin;
    @SearchField
    @Column(nullable = false)
    private String make;
    @SearchField
    @Column(nullable = false)
    private String model;
    private int modelYear;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(name = "numCylinders")
    private int cylinders;
    private int gears;
    private int horsepower;
    private int torque;
    private int seats;
    private double pricePerDay;
    private double mpg;
    @Convert(converter = Converters.JsonListConverter.class)
    @Column(columnDefinition = "json") @SearchField
    private ArrayList<String> features = new ArrayList<>();
    @Convert(converter = Converters.JsonListConverter.class)
    @Column(columnDefinition = "json")
    private ArrayList<String> images = new ArrayList<>();
    @Enumerated(EnumType.STRING)
    private TransmissionType transmission;
    @Enumerated(EnumType.STRING)
    private Drivetrain drivetrain;
    @Enumerated(EnumType.STRING)
    private EngineLayout engineLayout;
    @Enumerated(EnumType.STRING)
    private FuelType fuel;
    @Enumerated(EnumType.STRING)
    private BodyType bodyType;
    @Enumerated(EnumType.STRING)
    private RoofType roofType;
    @Enumerated(EnumType.STRING)
    private VehicleClass vehicleClass;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private CarStatus carStatus = CarStatus.AVAILABLE;
    @OneToMany(mappedBy = "car") @JsonManagedReference("car-reservation") @JsonIgnore
    private List<Reservation> reservations = new ArrayList<>();
    @OneToMany(mappedBy = "car") @JsonManagedReference("car-review") @JsonIgnore
    private List<Review> reviews = new ArrayList<>();

    // --- CONSTRUCTORS ---

    /** Default no-arg constructor required by JPA/Hibernate. */
    public Car() {}

    /**
     * Loads an existing car from the database by VIN and copies its fields into this instance.
     *
     * @param vin the vehicle VIN to look up
     * @throws IllegalAccessException if reflective field copy fails
     */
    public Car(String vin) throws IllegalAccessException {
        Car c = (Car) DatabaseController.getOne(Car.class, vin);
        EntityController.copyFields(c, this);
    }

    /**
     * Full constructor that validates and sets all car fields.
     *
     * @param vin           the 17-character Vehicle Identification Number (primary key)
     * @param make          the manufacturer name (e.g., "Toyota")
     * @param model         the model name (e.g., "Corolla")
     * @param modelYear     the model year (must be between 1 and 9999)
     * @param description   free-text vehicle description
     * @param cylinders     number of engine cylinders (0–99)
     * @param gears         number of transmission gears (1–99)
     * @param horsepower    engine horsepower (1–99999)
     * @param torque        engine torque in lb-ft (1–99999)
     * @param seats         passenger seating capacity (0–99)
     * @param pricePerDay   rental price in USD per day (0–999999)
     * @param mpg           fuel efficiency in miles per gallon (0–999)
     * @param features      list of feature tag strings
     * @param images        list of image URLs
     * @param transmission  transmission type
     * @param drivetrain    drivetrain configuration
     * @param engineLayout  engine/motor layout
     * @param fuel          fuel type
     * @param bodyType      body style
     * @param roofType      roof style
     * @param vehicleClass  vehicle market class
     * @param carStatus     vehicle status
     * @throws ValidationException if any numeric field is out of its valid range
     */
    public Car(String vin, String make, String model, int modelYear, String description,
            int cylinders, int gears, int horsepower, int torque, int seats, double pricePerDay, double mpg,
            ArrayList<String> features, ArrayList<String> images,
            TransmissionType transmission, Drivetrain drivetrain, EngineLayout engineLayout, FuelType fuel,
            BodyType bodyType, RoofType roofType, VehicleClass vehicleClass, CarStatus carStatus) throws ValidationException {

        setVin(vin);
        setMake(make);
        setModel(model);
        setModelYear(modelYear);
        setDescription(description);
        setCylinders(cylinders);
        setGears(gears);
        setHorsepower(horsepower);
        setTorque(torque);
        setSeats(seats);
        setPricePerDay(pricePerDay);
        setMpg(mpg);
        setFeatures(features);
        setImages(images);
        setTransmission(transmission);
        setDrivetrain(drivetrain);
        setEngineLayout(engineLayout);
        setFuel(fuel);
        setBodyType(bodyType);
        setRoofType(roofType);
        setVehicleClass(vehicleClass);
        setCarStatus(carStatus);
    }

    // --- GETTERS & SETTERS ---

    public String getVin() { return vin; }
    public String getMake() { return make; }
    public String getModel() { return model; }
    public int getModelYear() { return modelYear; }
    public String getDescription() { return description; }
    public int getCylinders() { return cylinders; }
    public int getGears() { return gears; }
    public int getHorsepower() { return horsepower; }
    public int getTorque() { return torque; }
    public int getSeats() { return seats; }
    public double getPricePerDay() { return pricePerDay; }
    public double getMpg() { return mpg; }
    public ArrayList<String> getFeatures() { return features; }
    public ArrayList<String> getImages() { return images; }
    public TransmissionType getTransmission() { return transmission; }
    public FuelType getFuel() { return fuel; }
    public Drivetrain getDrivetrain() { return drivetrain; }
    public EngineLayout getEngineLayout() { return engineLayout; }
    public BodyType getBodyType() { return bodyType; }
    public RoofType getRoofType() { return roofType; }
    public VehicleClass getVehicleClass() { return vehicleClass; }
    public CarStatus getCarStatus() { return carStatus; }

    public void setVin(String vin) { this.vin = vin; }
    public void setMake(String make) { this.make = make; }
    public void setModel(String model) { this.model = model; }
    public void setDescription(String description) { this.description = description; }
    public void setFeatures(ArrayList<String> features) { this.features = features; }
    public void setImages(ArrayList<String> images) { this.images = images; }
    public void setTransmission(TransmissionType transmission) { this.transmission = transmission; }
    public void setFuel(FuelType fuel) { this.fuel = fuel; }
    public void setDrivetrain(Drivetrain drivetrain) { this.drivetrain = drivetrain; }
    public void setEngineLayout(EngineLayout engineLayout) { this.engineLayout = engineLayout; }
    public void setBodyType(BodyType bodyType) { this.bodyType = bodyType; }
    public void setRoofType(RoofType roofType) { this.roofType = roofType; }
    public void setVehicleClass(VehicleClass vehicleClass) { this.vehicleClass = vehicleClass; }
    public void setCarStatus(CarStatus carStatus) { this.carStatus = carStatus; }

    @JsonIgnore
    public List<Reservation> getReservations() { return reservations; }
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

    // Setters with Validation

    /**
     * Sets the model year after validating it is in the range [1, 9999].
     *
     * @param modelYear the model year to set
     * @throws ValidationException if the value is out of range
     */
    public void setModelYear(int modelYear) throws ValidationException {
        if (modelYear > 0 && modelYear < 10000) {
            this.modelYear = modelYear;
        } else {
            throw new ValidationException("Invalid year: " + modelYear);
        }
    }

    /**
     * Sets the cylinder count after validating it is in the range [0, 99].
     *
     * @param cylinders the number of cylinders to set
     * @throws ValidationException if the value is out of range
     */
    public void setCylinders(int cylinders) throws ValidationException {
        if (cylinders >= 0 && cylinders < 100) {
            this.cylinders = cylinders;
        } else {
            throw new ValidationException("Invalid cylinders:" + cylinders);
        }
    }

    /**
     * Sets the gear count after validating it is in the range [1, 99].
     *
     * @param gears the number of gears to set
     * @throws ValidationException if the value is out of range
     */
    public void setGears(int gears) throws ValidationException {
        if (gears > 0 && gears < 100) {
            this.gears = gears;
        } else {
            throw new ValidationException("Invalid gears:" + gears);
        }
    }

    /**
     * Sets the horsepower after validating it is in the range [1, 99999].
     *
     * @param horsepower the horsepower value to set
     * @throws ValidationException if the value is out of range
     */
    public void setHorsepower(int horsepower) throws ValidationException {
        if (horsepower > 0 && horsepower < 100000) {
            this.horsepower = horsepower;
        } else {
            throw new ValidationException("Invalid horsepower:" + horsepower);
        }
    }

    /**
     * Sets the torque after validating it is in the range [1, 99999].
     *
     * @param torque the torque value in lb-ft to set
     * @throws ValidationException if the value is out of range
     */
    public void setTorque(int torque) throws ValidationException {
        if (torque > 0 && torque < 100000) {
            this.torque = torque;
        } else {
            throw new ValidationException("Invalid torque:" + torque);
        }
    }

    /**
     * Sets the seat count after validating it is in the range [0, 99].
     *
     * @param seats the number of seats to set
     * @throws ValidationException if the value is out of range
     */
    public void setSeats(int seats) throws ValidationException {
        if (seats >= 0 && seats < 100) {
            this.seats = seats;
        } else {
            throw new ValidationException("Invalid seats:" + seats);
        }
    }

    /**
     * Sets the rental price per day after validating it is in the range [0, 999999].
     *
     * @param pricePerDay the price in USD per rental day
     * @throws ValidationException if the value is out of range
     */
    public void setPricePerDay(double pricePerDay) throws ValidationException {
        if (pricePerDay >= 0 && pricePerDay < 1000000) {
            this.pricePerDay = pricePerDay;
        } else {
            throw new ValidationException("Invalid pricePerDay:" + pricePerDay);
        }
    }

    /**
     * Sets the miles-per-gallon rating after validating it is in the range [0, 999].
     *
     * @param mpg the fuel efficiency in MPG
     * @throws ValidationException if the value is out of range
     */
    public void setMpg(double mpg) throws ValidationException {
        if (mpg >= 0 && mpg < 1000) {
            this.mpg = mpg;
        } else {
            throw new ValidationException("Invalid MPG:" + mpg);
        }
    }

    // Methods

    /**
     * Returns the pick-up and drop-off time pairs for all reservations on this car.
     *
     * <p>Each inner list contains exactly two elements: {@code [pickUpTime, dropOffTime]}.</p>
     *
     * @return a list of {@code [pickUpTime, dropOffTime]} pairs, or an empty list if none exist
     */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public List<List<Instant>> getReservationDates() {
        if (reservations.isEmpty()) return List.of();
        else return reservations.stream().map(r -> List.of(r.getPickUpTime(), r.getDropOffTime()) ).toList();
    }

    @Override
    public String toString() {
        return "\n" +
                modelYear + " " + make + " " + model + " | " + vin + "" +
                "\n" + "Drivetrain: " + "" + (engineLayout != null ? engineLayout.toString().toLowerCase() : "N/A")
                + " " + cylinders + "-cylinder" + " " + (fuel != null ? fuel.toString().toLowerCase() : "N/A")
                + "\nPerformance: " + horsepower + "HP, TQ: " + torque + "\nSeats: " + seats + "\nMPG: " + mpg +
                "\nFeatures: " + features.toString() + "\n";
    }
}
