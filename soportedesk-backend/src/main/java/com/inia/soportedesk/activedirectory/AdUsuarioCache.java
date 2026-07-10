package com.inia.soportedesk.activedirectory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ad_usuarios_cache")
@Getter
@Setter
@NoArgsConstructor
public class AdUsuarioCache {
    @Id
    @Column(name = "sam_account_name", length = 120)
    private String samAccountName;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "given_name")
    private String givenName;

    @Column(name = "surname")
    private String surname;

    private String mail;
    private String department;
    private String company;
    private String title;

    @Column(name = "telephone_number")
    private String telephoneNumber;

    private String mobile;
    private String office;

    @Column(columnDefinition = "nvarchar(max)")
    private String description;

    @Column(name = "distinguished_name", columnDefinition = "nvarchar(max)")
    private String distinguishedName;

    @Column(name = "user_principal_name")
    private String userPrincipalName;

    private boolean enabled;
    private boolean locked;

    @Column(name = "organizational_unit")
    private String organizationalUnit;

    @Column(name = "when_created")
    private String whenCreated;

    @Column(name = "when_changed")
    private String whenChanged;

    @Column(name = "pwd_last_set")
    private String pwdLastSet;

    @Column(name = "last_logon_timestamp")
    private String lastLogonTimestamp;

    @Column(name = "account_expires")
    private String accountExpires;

    @Column(name = "bad_pwd_count")
    private String badPwdCount;

    @Column(name = "days_since_password_change")
    private Long daysSincePasswordChange;

    @Column(name = "days_since_last_logon")
    private Long daysSinceLastLogon;

    @Column(name = "lockout_time")
    private Long lockoutTime;

    @Column(name = "groups_text", columnDefinition = "nvarchar(max)")
    private String groupsText;

    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt;
}
