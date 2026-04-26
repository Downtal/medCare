package com.medcare.common.util;

import lombok.experimental.UtilityClass;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@UtilityClass
public class DateUtils {

    public static final DateTimeFormatter DATE_FORMATTER      = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    public static final DateTimeFormatter DATETIME_FORMATTER  = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    public static final DateTimeFormatter ISO_DATE_FORMATTER  = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Format LocalDateTime → "dd/MM/yyyy HH:mm:ss"
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        return dateTime.format(DATETIME_FORMATTER);
    }

    /**
     * Format LocalDate → "dd/MM/yyyy"
     */
    public static String formatDate(LocalDate date) {
        if (date == null) return "";
        return date.format(DATE_FORMATTER);
    }

    /**
     * Parse "dd/MM/yyyy HH:mm:ss" → LocalDateTime
     */
    public static LocalDateTime parseDateTime(String dateTimeStr) {
        return LocalDateTime.parse(dateTimeStr, DATETIME_FORMATTER);
    }

    /**
     * Parse "dd/MM/yyyy" → LocalDate
     */
    public static LocalDate parseDate(String dateStr) {
        return LocalDate.parse(dateStr, DATE_FORMATTER);
    }

    /**
     * Current time as formatted string.
     */
    public static String nowFormatted() {
        return formatDateTime(LocalDateTime.now());
    }
}
