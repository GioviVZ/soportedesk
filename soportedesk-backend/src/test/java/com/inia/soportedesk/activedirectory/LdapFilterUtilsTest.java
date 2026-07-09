package com.inia.soportedesk.activedirectory;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LdapFilterUtilsTest {

    @Test
    void escapeProtectsSpecialLdapFilterCharacters() {
        assertThat(LdapFilterUtils.escape("adm*(test)\\x\u0000"))
                .isEqualTo("adm\\2a\\28test\\29\\5cx\\00");
    }
}
