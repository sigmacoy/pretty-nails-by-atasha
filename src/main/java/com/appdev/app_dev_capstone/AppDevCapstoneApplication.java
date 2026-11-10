package com.appdev.app_dev_capstone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AppDevCapstoneApplication {

	public static void main(String[] args) {
//		SpringApplication.run(AppDevCapstoneApplication.class, args);

        System.setProperty("spring.datasource.url", "jdbc:postgresql://db.sdqvnqogadaynwfbtezj.supabase.co:5432/postgres");
        System.setProperty("spring.datasource.username", "postgres");
        System.setProperty("spring.datasource.password", "7WXI0TcuMXD");
        System.setProperty("spring.datasource.driver-class-name", "org.postgresql.Driver");
        SpringApplication.run(AppDevCapstoneApplication.class, args);
	}

}
