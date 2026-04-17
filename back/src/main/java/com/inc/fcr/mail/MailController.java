package com.inc.fcr.mail;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;

import java.util.List;
import java.util.Map;

/**
 * Sends transactional emails for the FCR rental system using the Resend API.
 *
 * <p>Requires the {@code RESEND_API_KEY} environment variable to be set.
 * The sender address is controlled by {@code MAIL_FROM} (defaults to
 * {@code onboarding@resend.dev} if not set).</p>
 *
 * <p>If {@code RESEND_API_KEY} is absent, email sending is silently skipped
 * and a warning is printed to stderr.</p>
 */
public class MailController {

    /** Resend API key read from the {@code RESEND_API_KEY} environment variable. */
    private static final String API_KEY  = System.getenv("RESEND_API_KEY");
    /** Sender email address read from the {@code MAIL_FROM} environment variable. */
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
    /**
     * Sends an account confirmation / magic-link login email.
     *
     * <p>The link is built as {@code <APP_URL>/auth/confirm/<token>}.
     * {@code APP_URL} defaults to {@code http://localhost:8080} if not set.</p>
     *
     * @param toEmail   recipient email address
     * @param firstName recipient first name (may be {@code null} for new accounts)
     * @param token     the UUID confirmation token
     */
    public static void sendAccountConfirmation(String toEmail, String firstName, String token) {
        if (API_KEY == null || API_KEY.isBlank()) {
            System.err.println("Mail: RESEND_API_KEY not set — skipping account confirmation email");
            return;
        }
        String appUrl = System.getenv("APP_URL");
        if (appUrl == null || appUrl.isBlank()) appUrl = "http://localhost:8080";
        String link = appUrl + "/auth/confirm/" + token;
        String greeting = (firstName != null && !firstName.isBlank()) ? "Hi " + firstName + "," : "Hi,";

        try {
            Resend resend = new Resend(API_KEY);
            CreateEmailOptions email = CreateEmailOptions.builder()
                    .from(MAIL_FROM != null ? MAIL_FROM : "onboarding@resend.dev")
                    .to(toEmail)
                    .subject("Sign in to FCR Inc")
                    .html("<div style='font-family:sans-serif;max-width:600px;margin:auto'>"
                            + "<h2>Sign in to FCR Inc</h2><p>" + greeting + "</p>"
                            + "<p>Click below to confirm your email and log in. This link expires in 24 hours.</p>"
                            + "<p><a href='" + link + "' style='display:inline-block;padding:12px 24px;"
                            + "background:#0070f3;color:#fff;text-decoration:none;border-radius:6px;"
                            + "font-weight:bold'>Sign in</a></p>"
                            + "<p>If you did not request this, you can safely ignore it.</p></div>")
                    .build();
            resend.emails().send(email);
            System.out.println("Mail: confirmation sent to " + toEmail);
        } catch (Exception e) {
            System.err.println("Mail: failed to send confirmation email — " + e.getMessage());
            e.printStackTrace();
        }
    }

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

    /**
     * Builds the HTML email body for a reservation confirmation.
     *
     * @param firstName      the recipient's first name
     * @param userId         the FCR user ID
     * @param paymentId      the Stripe payment/session ID
     * @param reservationIds the list of created reservation IDs
     * @param cars           per-car detail maps (keys: vin, make, model, year, pickUpTime, dropOffTime)
     * @return a self-contained HTML string suitable for use as the email body
     */
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
