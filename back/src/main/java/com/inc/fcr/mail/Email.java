package com.inc.fcr.mail;



public class Email {
    private final String to;
    private final String from;
    private final String subject;
    private final String html;
    private final String text;



    private Email(Builder builder) {
        this.to = builder.to;
        this.from = builder.from;
        this.subject = builder.subject;
        this.html = builder.html;
        this.text = builder.text;
    }

    public String getTo() {
        return to;
    }

    public String getFrom() {
        return from;
    }

    public String getSubject() {
        return subject;
    }

    public String getHtml() {
        return html;
    }

    public String getText() {
        return text;
    }

    public static class Builder {
        private String to;
        private String from;
        private String subject;
        private String html;
        private String text;

        public Builder to(String to) {
            this.to = to;
            return this;
        }

        public Builder from(String from) {
            this.from = from;
            return this;
        }

        public Builder subject(String subject) {
            this.subject = subject;
            return this;
        }

        public Builder html(String html) {
            this.html = html;
            return this;
        }

        public Builder text(String text) {
            this.text = text;
            return this;
        }

        public Email build() {
            validate();
            return new Email(this);
        }

        private void validate() {
            if (to == null || to.isBlank()) {
                throw new IllegalArgumentException("Email recipient is required");
            }
            if (from == null || from.isBlank()) {
                throw new IllegalArgumentException("Email sender is required");
            }
            if (subject == null || subject.isBlank()) {
                throw new IllegalArgumentException("Email subject is required");
            }
            if ((html == null || html.isBlank()) && (text == null || text.isBlank())) {
                throw new IllegalArgumentException("Email must have html or text content");
            }
        }
    }
}