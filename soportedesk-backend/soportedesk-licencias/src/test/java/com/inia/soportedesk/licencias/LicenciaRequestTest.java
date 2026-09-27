package com.inia.soportedesk.licencias;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class LicenciaRequestTest {

    private static final Validator VALIDATOR;

    static {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        VALIDATOR = factory.getValidator();
    }

    private LicenciaRequest validRequest() {
        LicenciaRequest request = new LicenciaRequest();
        request.setTipoLicenciaId(1L);
        request.setTipoBienId(1L);
        request.setDescripcion("Office 2024 Profesional Home and Business");
        request.setCuentaActivacion("j.perez@inia.gob.pe");
        request.setClaveActivacion("NKJFR-XXXXX-XXXXX-MNBVC");
        request.setOrdenCompra("OC-2024-00123");
        request.setAnio("2024");
        request.setCantidad(5);
        return request;
    }

    @Test
    void serialActivacion_withLongMultilineValue_hasNoViolations() {
        String muchasClaves = IntStream.range(0, 200)
                .mapToObj(i -> String.format("AAAAA-BBBBB-CCCCC-DDDDD-%05d", i))
                .collect(Collectors.joining("\n"));
        assertThat(muchasClaves.length()).isGreaterThan(200);

        LicenciaRequest request = validRequest();
        request.setSerialActivacion(muchasClaves);

        Set<ConstraintViolation<LicenciaRequest>> violations = VALIDATOR.validate(request);

        assertThat(violations).isEmpty();
    }
}
