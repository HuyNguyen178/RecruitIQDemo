package com.recruitiq.service;

import com.recruitiq.dto.CityResponse;
import com.recruitiq.model.City;
import com.recruitiq.repository.CityRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CityServiceTest {

    @Mock
    private CityRepository cityRepository;

    @InjectMocks
    private CityService cityService;

    @Test
    void getActiveCities_shouldReturnSortedResponses() {
        City hanoi = City.builder().id(1L).name("Hanoi").active(true).build();
        City hoChiMinh = City.builder().id(2L).name("Ho Chi Minh").active(true).build();
        when(cityRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(hanoi, hoChiMinh));

        List<CityResponse> result = cityService.getActiveCities();

        assertEquals(2, result.size());
        assertEquals("Hanoi", result.get(0).getName());
        assertEquals("Ho Chi Minh", result.get(1).getName());
    }
}
