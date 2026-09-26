package com.inia.soportedesk.activedirectory.config;

import javax.net.SocketFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;
import java.io.InputStream;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

/**
 * Referenced by class name via the JNDI "java.naming.ldap.factory.socket" property
 * (see LdapContextFactory). SRV-DC02's LDAPS certificate is issued by INIA's internal
 * root CA, which the JDK's default cacerts truststore does not trust out of the box.
 * This factory trusts the JVM's default CAs plus INIA's root CA (bundled as a resource),
 * so no machine-wide changes to the JDK installation are needed.
 */
public final class AdTrustedSocketFactory {
    private static final SSLSocketFactory DELEGATE = buildFactory();

    private AdTrustedSocketFactory() {
    }

    public static SocketFactory getDefault() {
        return DELEGATE;
    }

    private static SSLSocketFactory buildFactory() {
        try {
            KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType());
            trustStore.load(null, null);

            TrustManagerFactory defaultTmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            defaultTmf.init((KeyStore) null);
            int i = 0;
            for (TrustManager tm : defaultTmf.getTrustManagers()) {
                if (tm instanceof X509TrustManager x509TrustManager) {
                    for (X509Certificate cert : x509TrustManager.getAcceptedIssuers()) {
                        trustStore.setCertificateEntry("default-" + (i++), cert);
                    }
                }
            }

            CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");
            try (InputStream in = AdTrustedSocketFactory.class.getResourceAsStream("/security/inia-root-ca.cer")) {
                if (in != null) {
                    X509Certificate iniaRootCa = (X509Certificate) certificateFactory.generateCertificate(in);
                    trustStore.setCertificateEntry("inia-root-ca", iniaRootCa);
                }
            }

            TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            trustManagerFactory.init(trustStore);

            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustManagerFactory.getTrustManagers(), new SecureRandom());
            return sslContext.getSocketFactory();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo inicializar la confianza TLS para Active Directory", e);
        }
    }
}
