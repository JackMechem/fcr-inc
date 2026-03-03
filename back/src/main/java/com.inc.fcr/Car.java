package com.inc.fcr;

import com.inc.fcr.carenums.FuelType;
import com.inc.fcr.carenums.TransmissionType;

import java.util.ArrayList;

public class Car {

    private String vin; // vehicle identification number
    private String make; // manufacturer of car
    private String model; // product of manufacturer name
    private String modelYear; // year produced.
    private String description;
    private int numCylinders; // number of cylinders contained in engine
    private int numGears; // number of gears in transmission
    private int horsepower;
    private int torque;
    private int seatCount; // number of seats vehicle has
    private double pricePerDay; // set price per day
    private double combinedMPG; // average mpg of the vehicle either based on estimate or previous rental data
    private ArrayList<String> features = new ArrayList<String>(); // features that are a highlight of the car (heated seats, ambient lighting, driver assistance technology (adaptive cruise control, lane keep assist, etc.))

    // Car Enums
    private TransmissionType transmission; // Automatic or Manual transmission vehicle
    private FuelType fuel; // Gasoline, Diesel, Electric

    // Constructors
    public Car() {
    }

    public Car(String vin, String make, String model, String modelYear, String description,
               int numCylinders, int numGears, int horsepower, int torque, int seatCount,
               double pricePerDay, double combinedMPG, ArrayList<String> features,
               TransmissionType transmission, FuelType fuel) {
        this.vin = vin;
        this.make = make;
        this.model = model;
        this.modelYear = modelYear;
        this.description = description;
        this.numCylinders = numCylinders;
        this.numGears = numGears;
        this.horsepower = horsepower;
        this.torque = torque;
        this.seatCount = seatCount;
        this.pricePerDay = pricePerDay;
        this.combinedMPG = combinedMPG;
        this.features = features;
        this.transmission = transmission;
        this.fuel = fuel;
    }

    public String getVin() {
        return vin;
    }

    public void setVin(String vin) {
        this.vin = vin;
    }

    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getModelYear() {
        return modelYear;
    }

    public void setModelYear(String modelYear) {
        this.modelYear = modelYear;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getNumCylinders() {
        return numCylinders;
    }

    public void setNumCylinders(int numCylinders) {
        this.numCylinders = numCylinders;
    }

    public int getNumGears() {
        return numGears;
    }

    public void setNumGears(int numGears) {
        this.numGears = numGears;
    }

    public int getHorsepower() {
        return horsepower;
    }

    public void setHorsepower(int horsepower) {
        this.horsepower = horsepower;
    }

    public int getTorque() {
        return torque;
    }

    public void setTorque(int torque) {
        this.torque = torque;
    }

    public int getSeatCount() {
        return seatCount;
    }

    public void setSeatCount(int seatCount) {
        this.seatCount = seatCount;
    }

    public double getPricePerDay() {
        return pricePerDay;
    }

    public void setPricePerDay(double pricePerDay) {
        this.pricePerDay = pricePerDay;
    }

    public double getCombinedMPG() {
        return combinedMPG;
    }

    public void setCombinedMPG(double combinedMPG) {
        this.combinedMPG = combinedMPG;
    }

    public ArrayList<String> getFeatures() {
        return features;
    }

    public void setFeatures(ArrayList<String> features) {
        this.features = features;
    }

    public TransmissionType getTransmission() {
        return transmission;
    }

    public void setTransmission(TransmissionType transmission) {
        this.transmission = transmission;
    }

    public FuelType getFuel() {
        return fuel;
    }

    public void setFuel(FuelType fuel) {
        this.fuel = fuel;
    }
}
