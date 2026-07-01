package com.inia.soportedesk.glpi;

import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.Map;

@Configuration
@EnableJpaRepositories(
        basePackages = "com.inia.soportedesk.glpi",
        entityManagerFactoryRef = "glpiEntityManagerFactory",
        transactionManagerRef = "glpiTransactionManager")
public class GlpiDataSourceConfig {

    @Bean
    @ConfigurationProperties(prefix = "glpi.datasource")
    public DataSourceProperties glpiDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    public DataSource glpiDataSource(@Qualifier("glpiDataSourceProperties") DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean glpiEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("glpiDataSource") DataSource dataSource) {
        return builder
                .dataSource(dataSource)
                .packages("com.inia.soportedesk.glpi")
                .persistenceUnit("glpi")
                .properties(Map.of("hibernate.dialect", "org.hibernate.dialect.MySQLDialect"))
                .build();
    }

    @Bean
    public PlatformTransactionManager glpiTransactionManager(
            @Qualifier("glpiEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
