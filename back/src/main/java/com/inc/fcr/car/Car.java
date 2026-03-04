package com.inc.fcr.car;

import com.inc.fcr.car.enums.FuelType;
import com.inc.fcr.car.enums.TransmissionType;

import java.util.ArrayList;

public class Car {

    private String vin; // vehicle identification number
    private String make; // manufacturer
    private String model;
    private int year;
    private String description;
    private int cylinders;
    private int gears;
    private int horsepower;
    private int torque;
    private int seats;
    private double pricePerDay;
    private double mpg; // average combined miles per gallon
    private ArrayList<String> features = new ArrayList<String>(); // misc feature highlights
    // ex: heated seats, ambient lighting, adaptive cruise control, lane keep assist, etc.

    private TransmissionType transmission;
    private FuelType fuel;

    // Constructors
    public Car() {}
    public Car(String vin, String make, String model, int year, String description,
               int cylinders, int gears, int horsepower, int torque, int seats,
               double pricePerDay, double mpg, ArrayList<String> features,
               TransmissionType transmission, FuelType fuel) {
        this.vin = vin;
        this.make = make;
        this.model = model;
        this.year = year;
        this.description = description;
        this.cylinders = cylinders;
        this.gears = gears;
        this.horsepower = horsepower;
        this.torque = torque;
        this.seats = seats;
        this.pricePerDay = pricePerDay;
        this.mpg = mpg;
        this.features = features;
        this.transmission = transmission;
        this.fuel = fuel;
    }
    
    // Getters
    public String getVin() {return vin;}
    public String getMake() {return make;}
    public String getModel() {return model;}
    public int getYear() {return year;}
    public String getDescription() {return description;}
    public int getCylinders() {return cylinders;}
    public int getGears() {return gears;}
    public int getHorsepower() {return horsepower;}
    public int getTorque() {return torque;}
    public int getSeats() {return seats;}
    public double getPricePerDay() {return pricePerDay;}
    public double getMpg() {return mpg;}
    public ArrayList<String> getFeatures() {return features;}
    public TransmissionType getTransmission() {return transmission;}
    public FuelType getFuel() {return fuel;}
    
    // Setters
    public void setVin(String vin) {this.vin = vin;}
    public void setMake(String make) {this.make = make;}
    public void setModel(String model) {this.model = model;}
    public void setYear(int year) {this.year = year;}
    public void setDescription(String description) {this.description = description;}
    public void setCylinders(int cylinders) {this.cylinders = cylinders;}
    public void setGears(int gears) {this.gears = gears;}
    public void setHorsepower(int horsepower) {this.horsepower = horsepower;}
    public void setTorque(int torque) {this.torque = torque;}
    public void setSeats(int seats) {this.seats = seats;}
    public void setPricePerDay(double pricePerDay) {this.pricePerDay = pricePerDay;}
    public void setMpg(double mpg) {this.mpg = mpg;}
    public void setFeatures(ArrayList<String> features) {this.features = features;}
    public void setTransmission(TransmissionType transmission) {this.transmission = transmission;}
    public void setFuel(FuelType fuel) {this.fuel = fuel;}
}
