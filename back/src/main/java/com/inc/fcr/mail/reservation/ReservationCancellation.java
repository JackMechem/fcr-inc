package com.inc.fcr.mail.reservation;

import com.inc.fcr.mail.Email;
import com.inc.fcr.mail.EmailComposer;
import com.inc.fcr.mail.MailController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ReservationCancellation implements EmailComposer {

    private final String toEmail;
    private final String firstName;
    private final long userId;
    private final String paymentId;
    private final List<Long> reservationIds;
    private final List<Map<String, String>> cars;

    public ReservationCancellation(
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
                .subject("Official Reservation Cancellation Notice")
                .html(buildHtml())
                .text(buildText())
                .build();
    }

    private String buildHtml() {
        String safeFirstName = firstName != null && !firstName.trim().isEmpty()
                ? firstName.trim()
                : "Customer";

        StringBuilder sb = new StringBuilder();

        sb.append("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;'>");
        sb.append("<h2 style='color: #b00020;'>Reservation Cancellation Notice</h2>");
        sb.append("<p>Dear ").append(safeFirstName).append(",</p>");
        sb.append("<p>This email serves as official confirmation that your reservation has been cancelled.</p>");

        sb.append("<table style='width:100%; border-collapse: collapse; margin: 16px 0;'>");
        sb.append("<tr>")
                .append("<td style='padding:8px; font-weight:bold; width:35%;'>User ID</td>")
                .append("<td style='padding:8px;'>").append(userId).append("</td>")
                .append("</tr>");

        sb.append("<tr>")
                .append("<td style='padding:8px; font-weight:bold;'>Payment Reference</td>")
                .append("<td style='padding:8px;'>").append(paymentId != null ? paymentId : "N/A").append("</td>")
                .append("</tr>");

        if (reservationIds != null && !reservationIds.isEmpty()) {
            sb.append("<tr>")
                    .append("<td style='padding:8px; font-weight:bold;'>Reservation ID(s)</td>")
                    .append("<td style='padding:8px;'>")
                    .append(reservationIds.stream()
                            .map(String::valueOf)
                            .collect(Collectors.joining(", ")))
                    .append("</td>")
                    .append("</tr>");
        }

        sb.append("</table>");

        if (cars != null && !cars.isEmpty()) {
            sb.append("<h3 style='margin-top: 24px;'>Cancelled Vehicle Reservation Details</h3>");

            for (Map<String, String> car : cars) {
                sb.append("<table style='width:100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #ddd;'>");

                sb.append("<tr>")
                        .append("<td style='padding:8px; font-weight:bold; width:35%;'>Vehicle</td>")
                        .append("<td style='padding:8px;'>")
                        .append(value(car, "year")).append(" ")
                        .append(value(car, "make")).append(" ")
                        .append(value(car, "model"))
                        .append("</td>")
                        .append("</tr>");

                sb.append("<tr>")
                        .append("<td style='padding:8px; font-weight:bold;'>VIN</td>")
                        .append("<td style='padding:8px;'>").append(value(car, "vin")).append("</td>")
                        .append("</tr>");

                sb.append("<tr>")
                        .append("<td style='padding:8px; font-weight:bold;'>Pick-up</td>")
                        .append("<td style='padding:8px;'>").append(value(car, "pickUpTime")).append("</td>")
                        .append("</tr>");

                sb.append("<tr>")
                        .append("<td style='padding:8px; font-weight:bold;'>Drop-off</td>")
                        .append("<td style='padding:8px;'>").append(value(car, "dropOffTime")).append("</td>")
                        .append("</tr>");

                sb.append("</table>");
            }
        }

        sb.append("<p>If you did not request this cancellation or believe this was made in error, please contact Fast Car Rental immediately.</p>");
        sb.append("<p>Thank you,<br/>Fast Car Rental</p>");
        sb.append("</div>");

        return sb.toString();
    }

    private String buildText() {
        String safeFirstName = firstName != null && !firstName.trim().isEmpty()
                ? firstName.trim()
                : "Customer";

        StringBuilder sb = new StringBuilder();

        sb.append("OFFICIAL RESERVATION CANCELLATION NOTICE\n\n");
        sb.append("Dear ").append(safeFirstName).append(",\n\n");
        sb.append("This email serves as official confirmation that your reservation has been cancelled.\n\n");
        sb.append("User ID: ").append(userId).append("\n");
        sb.append("Payment Reference: ").append(paymentId != null ? paymentId : "N/A").append("\n");

        if (reservationIds != null && !reservationIds.isEmpty()) {
            sb.append("Reservation ID(s): ")
                    .append(reservationIds.stream()
                            .map(String::valueOf)
                            .collect(Collectors.joining(", ")))
                    .append("\n");
        }

        sb.append("\n");

        if (cars != null && !cars.isEmpty()) {
            sb.append("Cancelled Vehicle Reservation Details:\n\n");

            for (Map<String, String> car : cars) {
                sb.append("Vehicle: ")
                        .append(value(car, "year")).append(" ")
                        .append(value(car, "make")).append(" ")
                        .append(value(car, "model")).append("\n");
                sb.append("Pick-up: ").append(value(car, "pickUpTime")).append("\n");
                sb.append("Drop-off: ").append(value(car, "dropOffTime")).append("\n\n");
            }
        }

        sb.append("If you did not request this cancellation or believe this was made in error, please contact us immediately.\n\n");
        sb.append("Thank you,\n");
        sb.append("- Fast Car Rentals");

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