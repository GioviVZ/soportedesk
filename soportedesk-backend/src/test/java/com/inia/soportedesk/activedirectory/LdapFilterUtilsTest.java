package com.inia.soportedesk.activedirectory;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LdapFilterUtilsTest {

    @Test
    void escapeProtectsSpecialLdapFilterCharacters() {
        assertThat(LdapFilterUtils.escape("adm*(test)\\x\u0000"))
                .isEqualTo("adm\\2a\\28test\\29\\5cx\\00");
    }

    @Test
    void combinedUserSearchFilterUsesOnlyTermsWithTwoCharacters() {
        ActiveDirectoryService service = new ActiveDirectoryService(null, null, null, null, null, null, null, null);

        assertThat(service.buildUserSearchFilter("gv", "Gustavo", " "))
                .isEqualTo("(&(objectCategory=person)(objectClass=user)(|(sAMAccountName=*gv*)(userPrincipalName=*gv*)(mail=*gv*))(displayName=*Gustavo*))");
    }

    @Test
    void combinedUserSearchFilterEscapesEachTerm() {
        ActiveDirectoryService service = new ActiveDirectoryService(null, null, null, null, null, null, null, null);

        assertThat(service.buildUserSearchFilter("ad*", null, "Lab(1)"))
                .isEqualTo("(&(objectCategory=person)(objectClass=user)(|(sAMAccountName=*ad\\2a*)(userPrincipalName=*ad\\2a*)(mail=*ad\\2a*))(physicalDeliveryOfficeName=*Lab\\281\\29*))");
    }

    @Test
    void combinedUserSearchFilterUsesLocalPartForIniaUpn() {
        ActiveDirectoryService service = new ActiveDirectoryService(null, null, null, null, null, null, null, null);

        assertThat(service.buildUserSearchFilter("jlopez@inia.local", null, null))
                .isEqualTo("(&(objectCategory=person)(objectClass=user)(|(sAMAccountName=*jlopez*)(userPrincipalName=*jlopez@inia.local*)(mail=*jlopez@inia.local*)))");
    }
}
