package com.inc.fcr.mail.reservation;

import com.inc.fcr.mail.Email;
import com.inc.fcr.mail.EmailComposer;
import com.inc.fcr.mail.MailController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ReservationConfirmation implements EmailComposer {

    private final String toEmail;
    private final String firstName;
    private final long userId;
    private final String paymentId;
    private final List<Long> reservationIds;
    private final List<Map<String, String>> cars;

    public ReservationConfirmation(
            String toEmail,
            String firstName,
            long userId,
            String paymentId,
            List<Long> reservationIds,
            List<Map<String, String>> cars
    ) {
        this.toEmail = toEmail;
        this.firstName = firstName;
        this.userId = userId;
        this.paymentId = paymentId;
        this.reservationIds = reservationIds;
        this.cars = cars;
    }

    @Override
    public Email toEmail() {
        return new Email.Builder()
                .from(MailController.getDefaultFrom())
                .to(toEmail)
                .subject("Fast Car Rentals Reservation")
                .html(buildHtml())
                .text(buildText())
                .build();
    }

    private String buildHtml() {
        String safeFirstName = firstName != null ? firstName : "Customer";

        StringBuilder sb = new StringBuilder();
        sb.append("<div style='font-family: sans-serif; max-width: 600px; margin: auto;'>");
        sb.append("<h2>Reservation Confirmed</h2>");
        sb.append("<p>Hi ").append(safeFirstName).append(",</p>");
        sb.append("<p>Your reservation is confirmed. Here are your booking details:</p>");
        sb.append("<table style='width:100%; margin-bottom:16px;'>");
        sb.append("<tr><td style='padding:6px; font-weight:bold;'>User ID</td><td style='padding:6px;'>")
                .append(userId)
                .append("</td></tr>");
        sb.append("<tr><td style='padding:6px; font-weight:bold;'>Payment Reference</td><td style='padding:6px;'>")
                .append(paymentId != null ? paymentId : "")
                .append("</td></tr>");

        if (reservationIds != null && !reservationIds.isEmpty()) {
            sb.append("<tr><td style='padding:6px; font-weight:bold;'>Reservation ID(s)</td><td style='padding:6px;'>")
                    .append(reservationIds.stream()
                            .map(String::valueOf)
                            .collect(Collectors.joining(", ")))
                    .append("</td></tr>");
        }

        sb.append("</table>");
        sb.append("<hr/>");

        if (cars != null && !cars.isEmpty()) {
            for (Map<String, String> car : cars) {
                sb.append("<table style='width:100%; border-collapse: collapse; margin-bottom: 16px;'>");
                sb.append("<tr><td style='padding:6px; font-weight:bold;'>Vehicle</td>")
                        .append("<td style='padding:6px;'>")
                        .append(value(car, "year")).append(" ")
                        .append(value(car, "make")).append(" ")
                        .append(value(car, "model"))
                        .append("</td></tr>").append("<td style='padding:6px;'>").append(value(car, "vin")).append("</td></tr>");
                sb.append("<tr><td style='padding:6px; font-weight:bold;'>Pick-up</td>")
                        .append("<td style='padding:6px;'>").append(value(car, "pickUpTime")).append("</td></tr>");
                sb.append("<tr><td style='padding:6px; font-weight:bold;'>Drop-off</td>")
                        .append("<td style='padding:6px;'>").append(value(car, "dropOffTime")).append("</td></tr>");
                sb.append("</table><hr/>");
            }
        }

        sb.append("<p>Thank you for choosing Fast Car Rentals!</p>");
        sb.append("</div>");
        return sb.toString();
    }

    private String buildText() {
        String safeFirstName = firstName != null ? firstName : "Customer";

        StringBuilder sb = new StringBuilder();
        sb.append("Reservation Confirmed\n\n");
        sb.append("Hi ").append(safeFirstName).append(",\n\n");
        sb.append("Your reservation is confirmed.\n");
        sb.append("User ID: ").append(userId).append("\n");
        sb.append("Payment Reference: ").append(paymentId != null ? paymentId : "").append("\n");

        if (reservationIds != null && !reservationIds.isEmpty()) {
            sb.append("Reservation ID(s): ")
                    .append(reservationIds.stream()
                            .map(String::valueOf)
                            .collect(Collectors.joining(", ")))
                    .append("\n");
        }

        sb.append("\n");

        if (cars != null && !cars.isEmpty()) {
            for (Map<String, String> car : cars) {
                sb.append("Vehicle: ")
                        .append(value(car, "year")).append(" ")
                        .append(value(car, "make")).append(" ")
                        .append(value(car, "model")).append("\n");
                sb.append("Pick-up: ").append(value(car, "pickUpTime")).append("\n");
                sb.append("Drop-off: ").append(value(car, "dropOffTime")).append("\n\n");
            }
        }

        sb.append("Thank you for choosing FCR Inc!");
        return sb.toString();
    }

    private String value(Map<String, String> map, String key) {
        if (map == null) {
            return "";
        }
        String value = map.get(key);
        return value != null ? value : "";
    }
}