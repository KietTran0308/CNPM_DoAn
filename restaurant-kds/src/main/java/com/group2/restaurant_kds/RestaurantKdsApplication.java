package com.group2.restaurant_kds;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;


@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
public class RestaurantKdsApplication {

	public static void main(String[] args) {
		SpringApplication.run(RestaurantKdsApplication.class, args);
	}

}
