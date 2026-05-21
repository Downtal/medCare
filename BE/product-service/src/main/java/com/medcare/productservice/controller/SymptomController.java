package com.medcare.productservice.controller;

import com.medcare.productservice.entity.Symptom;
import com.medcare.productservice.repository.SymptomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/symptoms")
@RequiredArgsConstructor
public class SymptomController {

    private final SymptomRepository symptomRepository;

    @GetMapping
    public ResponseEntity<List<Symptom>> getAllSymptoms() {
        return ResponseEntity.ok(symptomRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Symptom> createSymptom(@RequestBody Symptom symptom) {
        return ResponseEntity.ok(symptomRepository.save(symptom));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSymptom(@PathVariable Long id) {
        symptomRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
