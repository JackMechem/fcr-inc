package com.inc.fcr.mail.util;

import com.inc.fcr.mail.Email;
import com.inc.fcr.mail.EmailComposer;
import com.inc.fcr.mail.MailController;

public class PasswordReset implements EmailComposer {

    private final String toEmail;
    private final String firstName;
    private final String resetLink;

    public PasswordReset(String toEmail, String firstName, String resetLink) {
        this.toEmail = toEmail;
        this.firstName = firstName;
        this.resetLink = resetLink;
    }

    @Override
    public Email toEmail() {
        return new Email.Builder()
                .from(MailController.getDefaultFrom())
                .to(toEmail)
                .subject("Password Reset Requested - Fast Car Rentals")
                .html(buildHtml())
                .text(buildText())
                .build();
    }

    private String buildHtml() {
        String safeFirstName = firstName != null && !firstName.trim().isEmpty()
                ? firstName.trim()
                : "Customer";

        String safeResetLink = resetLink != null ? resetLink : "#";

        StringBuilder sb = new StringBuilder();
        sb.append("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;'>");
        sb.append("<h2>Password Reset Request</h2>");
        sb.append("<p>Hi ").append(safeFirstName).append(",</p>");
        sb.append("<p>We received a request to reset your Fast Car Rentals account password.</p>");
        sb.append("<p>To reset your password, click the button below:</p>");
        sb.append("<p style='margin: 24px 0;'>");
        sb.append("<a href='").append(safeResetLink).append("' ")
                .append("style='background-color: #000; color: #fff; padding: 12px 20px; ")
                .append("text-decoration: none; border-radius: 4px; display: inline-block;'>")
                .append("Reset Password")
                .append("</a>");
        sb.append("</p>");
        sb.append("<p>If you did not request a password reset, you can safely ignore this email.</p>");
        sb.append("<hr/>");
        sb.append("<p>If the button does not work, copy and paste this link into your browser:</p>");
        sb.append("<p>").append(safeResetLink).append("</p>");
        sb.append("<p>— Fast Car Rentals</p>");
        sb.append("</div>");
        return sb.toString();
    }

    private String buildText() {
        String safeFirstName = firstName != null && !firstName.trim().isEmpty()
                ? firstName.trim()
                : "Customer";

        String safeResetLink = resetLink != null ? resetLink : "";

        StringBuilder sb = new StringBuilder();
        sb.append("Password Reset Request\n\n");
        sb.append("Hi ").append(safeFirstName).append(",\n\n");
        sb.append("We received a request to reset your Fast Car Rentals account password.\n\n");
        sb.append("Use the link below to reset your password:\n");
        sb.append(safeResetLink).append("\n\n");
        sb.append("If you did not request a password reset, you can safely ignore this email.\n\n");
        sb.append("— Fast Car Rentals");
        return sb.toString();
    }
}