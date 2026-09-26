package com.inia.soportedesk.activedirectory.dto;

import java.util.List;

public record AdUser(
        String samAccountName,
        String displayName,
        String givenName,
        String surname,
        String mail,
        String department,
        String company,
        String title,
        String telephoneNumber,
        String mobile,
        String office,
        String description,
        String distinguishedName,
        String userPrincipalName,
        boolean enabled,
        boolean locked,
        String organizationalUnit,
        String whenCreated,
        String whenChanged,
        String pwdLastSet,
        String lastLogonTimestamp,
        String accountExpires,
        String badPwdCount,
        Long daysSincePasswordChange,
        List<String> groups
) {
}
