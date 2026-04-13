package com.inc.fcr.car;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.inc.fcr.database.Converters;
import com.inc.fcr.database.SearchField;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.EntityController;
import jakarta.persistence.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.errorHandling.*;
import com.inc.fcr.car.enums.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "cars")
public class Car {

    // Deprecated (old API controller)
    @FunctionalInterface
    public interface ThrowingBiConsumer<T, U> {
        void accept(T t, U u) throws ValidationException;
    }

    @Transient 
    private static final ObjectMapper mapper = new ObjectMapper();

    @Transient 
    public static final Map<String, ThrowingBiConsumer<Car, JsonNode>> setterKeyMap = Map.ofEntries(
            Map.entry("vin", (c, v) -> c.setVin(v.asText())),
            Map.entry("make", (c, v) -> c.setMake(v.asText())),
            Map.entry("model", (c, v) -> c.setModel(v.asText())),
            Map.entry("modelYear", (c, v) -> c.setModelYear(v.asInt())),
            Map.entry("description", (c, v) -> c.setDescription(v.asText())),
            Map.entry("cylinders", (c, v) -> c.setCylinders(v.asInt())),
            Map.entry("gears", (c, v) -> c.setGears(v.asInt())),
            Map.entry("horsepower", (c, v) -> c.setHorsepower(v.asInt())),
            Map.entry("torque", (c, v) -> c.setTorque(v.asInt())),
            Map.entry("seats", (c, v) -> c.setSeats(v.asInt())),
            Map.entry("pricePerDay", (c, v) -> c.setPricePerDay(v.asDouble())),
            Map.entry("mpg", (c, v) -> c.setMpg(v.asDouble())),
            Map.entry("features", (c, v) -> c.setFeatures(mapper.convertValue(v, new TypeReference<ArrayList<String>>() {}))),
            Map.entry("images", (c, v) -> c.setImages(mapper.convertValue(v, new TypeReference<ArrayList<String>>() {}))),
            Map.entry("transmission", (c, v) -> c.setTransmission(TransmissionType.valueOf(v.asText()))),
            Map.entry("drivetrain", (c, v) -> c.setDrivetrain(Drivetrain.valueOf(v.asText()))),
            Map.entry("engineLayout", (c, v) -> c.setEngineLayout(EngineLayout.valueOf(v.asText()))),
            Map.entry("fuel", (c, v) -> c.setFuel(FuelType.valueOf(v.asText()))),
            Map.entry("bodyType", (c, v) -> c.setBodyType(BodyType.valueOf(v.asText()))),
            Map.entry("roofType", (c, v) -> c.setRoofType(RoofType.valueOf(v.asText()))),
            Map.entry("vehicleClass", (c, v) -> c.setVehicleClass(VehicleClass.valueOf(v.asText())))
    );

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
    @OneToMany(mappedBy = "car") @JsonManagedReference @JsonIgnore
    private List<Reservation> reservations = new ArrayList<>();

    // --- CONSTRUCTORS ---

    public Car() {}

    public Car(String vin) throws IllegalAccessException {
        Car c = (Car) DatabaseController.getOne(Car.class, vin);
        EntityController.copyFields(c, this);
    }

    public Car(String vin, String make, String model, int modelYear, String description,
            int cylinders, int gears, int horsepower, int torque, int seats, double pricePerDay, double mpg,
            ArrayList<String> features, ArrayList<String> images,
            TransmissionType transmission, Drivetrain drivetrain, EngineLayout engineLayout, FuelType fuel,
            BodyType bodyType, RoofType roofType, VehicleClass vehicleClass) throws ValidationException {

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
    }

    // --- GETTERS & SETTERS ---

    public String getVin() { return vin; }
    public void setVin(String vin) { this.vin = vin; }

    public String getMake() { return make; }
    public void setMake(String make) { this.make = make; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public int getModelYear() { return modelYear; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getCylinders() { return cylinders; }

    public int getGears() { return gears; }

    public int getHorsepower() { return horsepower; }

    public int getTorque() { return torque; }

    public int getSeats() { return seats; }

    public double getPricePerDay() { return pricePerDay; }

    public double getMpg() { return mpg; }

    public ArrayList<String> getFeatures() { return features; }
    public void setFeatures(ArrayList<String> features) { this.features = features; }

    public ArrayList<String> getImages() { return images; }
    public void setImages(ArrayList<String> images) { this.images = images; }

    public TransmissionType getTransmission() { return transmission; }
    public void setTransmission(TransmissionType transmission) { this.transmission = transmission; }

    public FuelType getFuel() { return fuel; }
    public void setFuel(FuelType fuel) { this.fuel = fuel; }

    public Drivetrain getDrivetrain() { return drivetrain; }
    public void setDrivetrain(Drivetrain drivetrain) { this.drivetrain = drivetrain; }

    public EngineLayout getEngineLayout() { return engineLayout; }
    public void setEngineLayout(EngineLayout engineLayout) { this.engineLayout = engineLayout; }

    public BodyType getBodyType() { return bodyType; }
    public void setBodyType(BodyType bodyType) { this.bodyType = bodyType; }

    public RoofType getRoofType() { return roofType; }
    public void setRoofType(RoofType roofType) { this.roofType = roofType; }

    public VehicleClass getVehicleClass() { return vehicleClass; }
    public void setVehicleClass(VehicleClass vehicleClass) { this.vehicleClass = vehicleClass; }

    @JsonIgnore
    public List<Reservation> getReservations() { return reservations; }
    public List<Long> getReservationIds() { return reservations.stream().map(Reservation::getReservationId).toList(); }

    // Setters with Validation

    public void setModelYear(int modelYear) throws ValidationException {
        if (modelYear > 0 && modelYear < 10000) {
            this.modelYear = modelYear;
        } else {
            throw new ValidationException("Invalid year: " + modelYear);
        }
    }

    public void setCylinders(int cylinders) throws ValidationException {
        if (cylinders >= 0 && cylinders < 100) {
            this.cylinders = cylinders;
        } else {
            throw new ValidationException("Invalid cylinders:" + cylinders);
        }
    }

    public void setGears(int gears) throws ValidationException {
        if (gears > 0 && gears < 100) {
            this.gears = gears;
        } else {
            throw new ValidationException("Invalid gears:" + gears);
        }
    }

    public void setHorsepower(int horsepower) throws ValidationException {
        if (horsepower > 0 && horsepower < 100000) {
            this.horsepower = horsepower;
        } else {
            throw new ValidationException("Invalid horsepower:" + horsepower);
        }
    }

    public void setTorque(int torque) throws ValidationException {
        if (torque > 0 && torque < 100000) {
            this.torque = torque;
        } else {
            throw new ValidationException("Invalid torque:" + torque);
        }
    }

    public void setSeats(int seats) throws ValidationException {
        if (seats >= 0 && seats < 100) {
            this.seats = seats;
        } else {
            throw new ValidationException("Invalid seats:" + seats);
        }
    }

    public void setPricePerDay(double pricePerDay) throws ValidationException {
        if (pricePerDay >= 0 && pricePerDay < 1000000) {
            this.pricePerDay = pricePerDay;
        } else {
            throw new ValidationException("Invalid pricePerDay:" + pricePerDay);
        }
    }

    public void setMpg(double mpg) throws ValidationException {
        if (mpg >= 0 && mpg < 1000) {
            this.mpg = mpg;
        } else {
            throw new ValidationException("Invalid MPG:" + mpg);
        }
    }

    // Methods

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
