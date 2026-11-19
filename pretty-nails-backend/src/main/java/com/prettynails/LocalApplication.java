package com.prettynails;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import com.giffing.bucket4j.spring.boot.starter.config.filter.servlet.Bucket4JAutoConfigurationServletFilter;
import com.giffing.bucket4j.spring.boot.starter.config.filter.reactive.webflux.Bucket4JAutoConfigurationWebfluxFilter;
import com.giffing.bucket4j.spring.boot.starter.config.filter.reactive.gateway.Bucket4JAutoConfigurationSpringCloudGatewayFilter;
import com.giffing.bucket4j.spring.boot.starter.Bucket4jStartupCheckConfiguration;

@SpringBootApplication
@EnableAutoConfiguration(exclude = {
    Bucket4JAutoConfigurationServletFilter.class,
    Bucket4JAutoConfigurationWebfluxFilter.class,
    Bucket4JAutoConfigurationSpringCloudGatewayFilter.class,
    Bucket4jStartupCheckConfiguration.class
})
public class LocalApplication extends PrettyNailsApplication {
    public static void main(String[] args) {
        SpringApplication.run(LocalApplication.class, args);
    }
}