package com.example.crypto.controller;

import com.example.crypto.dto.StudentCryptoResult;
import com.example.crypto.dto.StudentInput;
import com.example.crypto.service.crt.CRT;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/crypto")
public class CryptoController {

    @PostMapping("/process-batch")
    public ResponseEntity<List<StudentCryptoResult>> processBatch(
            @RequestBody List<StudentInput> list) {

        List<StudentCryptoResult> result = new ArrayList<>();

        try {
            for (StudentInput s : list) {
                String maKhoa = s.maKhoa != null ? s.maKhoa.trim() : "";

                List<String> primes = new ArrayList<>();
                List<String> encryption = CRT.result(maKhoa, primes);

                StudentCryptoResult r = new StudentCryptoResult();
                r.maKhoa = maKhoa;
                r.primes = primes;
                r.encryption = encryption;

                result.add(r);
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
