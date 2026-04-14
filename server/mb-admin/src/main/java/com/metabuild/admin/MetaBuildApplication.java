package com.metabuild.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.metabuild")
public class MetaBuildApplication {

    public static void main(String[] args) {
        SpringApplication.run(MetaBuildApplication.class, args);
    }
}
