package com.inia.soportedesk.activedirectory;

public final class LdapFilterUtils {
    private LdapFilterUtils() {
    }

    public static String escape(String value) {
        if (value == null) {
            return "";
        }
        StringBuilder escaped = new StringBuilder(value.length());
        for (char c : value.toCharArray()) {
            switch (c) {
                case '\\' -> escaped.append("\\5c");
                case '*' -> escaped.append("\\2a");
                case '(' -> escaped.append("\\28");
                case ')' -> escaped.append("\\29");
                case '\u0000' -> escaped.append("\\00");
                default -> escaped.append(c);
            }
        }
        return escaped.toString();
    }
}
