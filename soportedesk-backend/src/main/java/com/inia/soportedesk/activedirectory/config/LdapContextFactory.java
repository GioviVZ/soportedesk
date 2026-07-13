package com.inia.soportedesk.activedirectory.config;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.naming.Context;
import javax.naming.directory.DirContext;
import javax.naming.ldap.InitialLdapContext;
import javax.naming.ldap.LdapContext;
import java.util.Hashtable;

@Component
@RequiredArgsConstructor
public class LdapContextFactory {
    private final AdProperties properties;

    public DirContext openDirContext() throws Exception {
        return openLdapContext();
    }

    public LdapContext openLdapContext() throws Exception {
        validateCredentials();
        LdapContext context = new InitialLdapContext(environment(), null);
        try {
            context.reconnect(null);
            context.getAttributes(baseDn(), new String[]{"objectClass"});
            return context;
        } catch (Exception e) {
            context.close();
            throw e;
        }
    }

    public String baseDn() {
        return properties.getBaseDn();
    }

    private void validateCredentials() {
        if (properties.getBindUser() == null || properties.getBindUser().isBlank()) {
            throw new IllegalStateException("AD_BIND_USER no esta configurado.");
        }
        if (properties.getBindPassword() == null || properties.getBindPassword().isBlank()) {
            throw new IllegalStateException("AD_BIND_PASSWORD no esta configurado.");
        }
    }

    private Hashtable<String, String> environment() {
        Hashtable<String, String> env = new Hashtable<>();
        env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
        env.put(Context.PROVIDER_URL, properties.getUrl());
        env.put(Context.SECURITY_AUTHENTICATION, "simple");
        env.put(Context.SECURITY_PRINCIPAL, properties.getBindUser());
        env.put(Context.SECURITY_CREDENTIALS, properties.getBindPassword());
        env.put(Context.REFERRAL, properties.getReferral());
        env.put("java.naming.ldap.factory.socket", AdTrustedSocketFactory.class.getName());
        return env;
    }
}
