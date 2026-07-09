package com.inia.soportedesk.activedirectory.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ad")
public class AdProperties {
    private String url;
    private String baseDn;
    private String bindUser;
    private String bindPassword;
    private String referral = "ignore";
}
