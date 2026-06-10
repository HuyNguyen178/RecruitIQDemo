package com.recruitiq.config;

import com.recruitiq.model.City;
import com.recruitiq.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class CityDataInitializer implements ApplicationRunner {

    private final CityRepository cityRepository;

    private static final List<String> DEFAULT_CITIES = List.of(
            "Hanoi",
            "Ho Chi Minh City",
            "Da Nang",
            "Hai Phong",
            "Can Tho",
            "Bien Hoa",
            "Hue",
            "Nha Trang",
            "Vung Tau",
            "Bac Ninh",
            "Remote"
    );

    @Override
    public void run(ApplicationArguments args) {
        if (cityRepository.count() > 0) {
            return;
        }

        log.info("Seeding default cities...");
        for (String name : DEFAULT_CITIES) {
            cityRepository.save(City.builder().name(name).active(true).build());
        }
        log.info("Seeded {} cities", DEFAULT_CITIES.size());
    }
}
