package com.inc.fcr.car;

import com.inc.fcr.ValidationException;
import com.inc.fcr.car.enums.*;
import java.util.ArrayList;

public class Car {

    private String vin; 
    private String make;
    private String model;
    private int modelYear;
    private String description;
    private int cylinders;
    private int gears;
    private int horsepower;
    private int torque;
    private int seats;
    private double pricePerDay;
    private double mpg;
    private ArrayList<String> features = new ArrayList<String>();
    private ArrayList<String> images = new ArrayList<String>();
    private TransmissionType transmission;
    private Drivetrain drivetrain;
    private EngineLayout engineLayout;
    private FuelType fuel;
    private BodyType bodyType;
    private RoofType roofType;
    private VehicleClass vehicleClass;

    public Car(String vin, String make, String model, int modelYear, String description,
               int cylinders, int gears, int horsepower, int torque, int seats, double pricePerDay, double mpg, ArrayList<String> features, ArrayList<String> images,
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
        setTransmission(transmission);
        setDrivetrain(drivetrain);
        setEngineLayout(engineLayout);
        setFuel(fuel);
        setImages(images);
        setBodyType(bodyType);
        setRoofType(roofType);
        setVehicleClassProperty(vehicleClass);
    }

    // Getters
    public String getVin() {
        return vin;
    }

    public String getMake() {
        return make;
    }

    public String getModel() {
        return model;
    }

    public int getYear() {
        return modelYear;
    }

    public String getDescription() {
        return description;
    }

    public int getCylinders() {
        return cylinders;
    }

    public int getGears() {
        return gears;
    }

    public int getHorsepower() {
        return horsepower;
    }

    public int getTorque() {
        return torque;
    }

    public int getSeats() {
        return seats;
    }

    public double getPricePerDay() {
        return pricePerDay;
    }

    public double getMpg() {
        return mpg;
    }

    public ArrayList<String> getFeatures() {
        return features;
    }

    public ArrayList<String> getImages() {
        return images;
    }

    public TransmissionType getTransmission() {
        return transmission;
    }

    public FuelType getFuel() {
        return fuel;
    }

    public Drivetrain getDrivetrain() {
        return drivetrain;
    }

    public EngineLayout getEngineLayout() {
        return engineLayout;
    }

    public BodyType getBodyType() {
        return bodyType;
    }

    public RoofType getRoofType() {
        return roofType;
    }

    public VehicleClass getVehicleClassProperty() {
        return vehicleClass;
    }

    // Setters
    // NOTE: consider for String types: default null or ""?
    //       should we data validate String types?
    public void setVin(String vin) {
        this.vin = vin;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public void setBodyType(BodyType bodyType) {
        this.bodyType = bodyType;
    }

    public void setRoofType(RoofType roofType) {
        this.roofType = roofType;
    }

    public void setVehicleClassProperty(VehicleClass vehicleClass) {
        this.vehicleClass = vehicleClass;
    }

    public void setModelYear(int modelYear) throws ValidationException {
        if (modelYear > 0 && modelYear < 10000) {
            this.modelYear = modelYear;
        } else {
            throw new ValidationException("Invalid year: " + modelYear);
        }
    }

    public void setDescription(String description) {
        this.description = description;
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

    public void setFeatures(ArrayList<String> features) {
        this.features = features;
    }

    public void setImages(ArrayList<String> images) {
        this.images = images;
    }

    public void setTransmission(TransmissionType transmission) {
        this.transmission = transmission;
    }

    public void setFuel(FuelType fuel) {
        this.fuel = fuel;
    }

    public void setDrivetrain(Drivetrain drivetrain) {
        this.drivetrain = drivetrain;
    }

    public void setEngineLayout(EngineLayout engineLayout) {
        this.engineLayout = engineLayout;
    }

    // methods

    @Override
    public String toString() {
        return "\n" +
                modelYear + " " + make + " " + model + " | " + vin + "" +
                "\n" + "Drivetrain: " + "" + engineLayout.toString().toLowerCase() + " " + cylinders + "-cylinder" + " " + fuel.toString().toLowerCase()
                + "\nPerformance: " + horsepower + "HP, TQ: " + torque + "\nSeats: " + seats + "\nMPG: " + mpg +
                "\nFeatures: " + features.toString()+"\n";


    }
}
