package com.inia.soportedesk.activedirectory.config;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.naming.Context;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import javax.naming.ldap.InitialLdapContext;
import javax.naming.ldap.LdapContext;
import java.util.Hashtable;

@Component
@RequiredArgsConstructor
public class LdapContextFactory {
    private final AdProperties properties;

    public DirContext openDirContext() throws Exception {
        return new InitialDirContext(environment());
    }

    public LdapContext openLdapContext() throws Exception {
        return new InitialLdapContext(environment(), null);
    }

    public String baseDn() {
        return properties.getBaseDn();
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
