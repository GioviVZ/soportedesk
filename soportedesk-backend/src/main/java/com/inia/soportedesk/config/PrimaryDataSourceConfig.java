package com.inia.soportedesk.config;

import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateProperties;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateSettings;
import org.springframework.boot.autoconfigure.orm.jpa.JpaProperties;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.orm.hibernate5.SpringBeanContainer;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class PrimaryDataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @Primary
    public DataSource dataSource(@Qualifier("dataSourceProperties") DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    @Bean(name = "entityManagerFactory")
    @Primary
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("dataSource") DataSource dataSource,
            JpaProperties jpaProperties,
            HibernateProperties hibernateProperties,
            ConfigurableListableBeanFactory beanFactory) {
        Map<String, Object> properties = new HashMap<>(hibernateProperties.determineHibernateProperties(
                jpaProperties.getProperties(),
                new HibernateSettings()));
        properties.put(AvailableSettings.BEAN_CONTAINER, new SpringBeanContainer(beanFactory));

        return builder
                .dataSource(dataSource)
                .packages(
                        "com.inia.soportedesk.auth",
                        "com.inia.soportedesk.catalogo",
                        "com.inia.soportedesk.usuariosred",
                        "com.inia.soportedesk.equipos",
                        "com.inia.soportedesk.vpn",
                        "com.inia.soportedesk.correos",
                        "com.inia.soportedesk.impresoras",
                        "com.inia.soportedesk.auditoria",
                        "com.inia.soportedesk.inventario",
                        "com.inia.soportedesk.wifi",
                        "com.inia.soportedesk.licencias",
                        "com.inia.soportedesk.gestiontiinia")
                .persistenceUnit("default")
                .properties(properties)
                .build();
    }

    @Bean(name = "transactionManager")
    @Primary
    public PlatformTransactionManager transactionManager(
            @Qualifier("entityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
