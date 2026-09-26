package com.inia.soportedesk.licencias;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LicenciaCredentialConverterTest {

    private static final String TEST_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

    private final LicenciaCredentialConverter converter = new LicenciaCredentialConverter(TEST_KEY);

    @Test
    void convertToDatabaseColumn_thenConvertToEntityAttribute_roundTrips() {
        String plaintext = "MiClaveSecreta123!";

        String encrypted = converter.convertToDatabaseColumn(plaintext);

        assertThat(encrypted).isNotEqualTo(plaintext);
        assertThat(converter.convertToEntityAttribute(encrypted)).isEqualTo(plaintext);
    }

    @Test
    void convertToDatabaseColumn_withNull_returnsNull() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
    }

    @Test
    void convertToDatabaseColumn_withBlank_returnsBlankUnchanged() {
        assertThat(converter.convertToDatabaseColumn("   ")).isEqualTo("   ");
    }

    @Test
    void convertToEntityAttribute_withNull_returnsNull() {
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }

    @Test
    void convertToDatabaseColumn_producesDifferentCiphertextEachTime() {
        String plaintext = "MismaClave";

        String first = converter.convertToDatabaseColumn(plaintext);
        String second = converter.convertToDatabaseColumn(plaintext);

        assertThat(first).isNotEqualTo(second);
    }
}
