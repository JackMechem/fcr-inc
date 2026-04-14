package com.inc.fcr.mail;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;

import java.util.List;
import java.util.Map;

public class MailController {

    private static final String API_KEY  = System.getenv("RESEND_API_KEY");
    private static final String MAIL_FROM = System.getenv("MAIL_FROM");

    /**
     * Sends a reservation confirmation email via Resend.
     *
     * @param toEmail        recipient email address
     * @param firstName      recipient first name
     * @param userId         FCR user ID
     * @param paymentId      Stripe payment/session ID
     * @param reservationIds list of created reservation IDs
     * @param cars           list of maps with keys: vin, make, model, year, pickUpTime, dropOffTime
     */
    public static void sendReservationConfirmation(String toEmail, String firstName, long userId, String paymentId, List<Long> reservationIds, List<Map<String, String>> cars) {
        if (API_KEY == null || API_KEY.isBlank()) {
            System.err.println("Mail: RESEND_API_KEY not set — skipping confirmation email");
            return;
        }

        try {
            Resend resend = new Resend(API_KEY);

            CreateEmailOptions email = CreateEmailOptions.builder()
                    .from(MAIL_FROM != null ? MAIL_FROM : "onboarding@resend.dev")
                    .to(toEmail)
                    .subject("Your Reservation Confirmation — FCR Inc")
                    .html(buildHtml(firstName, userId, paymentId, reservationIds, cars))
                    .build();

            resend.emails().send(email);
            System.out.println("Mail: confirmation sent to " + toEmail);

        } catch (Exception e) {
            System.err.println("Mail: failed to send confirmation email — " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static String buildHtml(String firstName, long userId, String paymentId, List<Long> reservationIds, List<Map<String, String>> cars) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div style='font-family: sans-serif; max-width: 600px; margin: auto;'>");
        sb.append("<h2>Reservation Confirmed</h2>");
        sb.append("<p>Hi ").append(firstName).append(",</p>");
        sb.append("<p>Your reservation is confirmed. Here are your booking details:</p>");
        sb.append("<table style='width:100%; margin-bottom:16px;'>");
        sb.append("<tr><td style='padding:6px; font-weight:bold;'>User ID</td><td style='padding:6px;'>").append(userId).append("</td></tr>");
        sb.append("<tr><td style='padding:6px; font-weight:bold;'>Payment Reference</td><td style='padding:6px;'>").append(paymentId).append("</td></tr>");
        if (!reservationIds.isEmpty()) {
            sb.append("<tr><td style='padding:6px; font-weight:bold;'>Reservation ID(s)</td><td style='padding:6px;'>")
              .append(reservationIds.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(", ")))
              .append("</td></tr>");
        }
        sb.append("</table>");
        sb.append("<hr/>");

        for (Map<String, String> car : cars) {
            sb.append("<table style='width:100%; border-collapse: collapse; margin-bottom: 16px;'>");
            sb.append("<tr><td style='padding:6px; font-weight:bold;'>Vehicle</td>")
              .append("<td style='padding:6px;'>").append(car.get("year")).append(" ").append(car.get("make")).append(" ").append(car.get("model")).append("</td></tr>");
            sb.append("<tr><td style='padding:6px; font-weight:bold;'>VIN</td>")
              .append("<td style='padding:6px;'>").append(car.get("vin")).append("</td></tr>");
            sb.append("<tr><td style='padding:6px; font-weight:bold;'>Pick-up</td>")
              .append("<td style='padding:6px;'>").append(car.get("pickUpTime")).append("</td></tr>");
            sb.append("<tr><td style='padding:6px; font-weight:bold;'>Drop-off</td>")
              .append("<td style='padding:6px;'>").append(car.get("dropOffTime")).append("</td></tr>");
            sb.append("</table><hr/>");
        }

        sb.append("<p>Thank you for choosing FCR Inc!</p>");
        sb.append("</div>");
        return sb.toString();
    }
}
