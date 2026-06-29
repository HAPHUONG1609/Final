package com.example.crypto.controller;

import com.example.crypto.dto.ClassCryptoInput;
import com.example.crypto.dto.ClassCryptoResult;
//import com.example.crypto.dto.StudentKeyInput;
import com.example.crypto.service.lop.LopCryptoService;
import com.example.crypto.dto.PrimeIndexInput;
import com.example.crypto.service.index.PrimeIndexService;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

//import java.math.BigInteger;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/crypto")
public class CryptoInternalController {

    // Khai báo biến Instance (Đây là biến sẽ dùng để gọi hàm)
    @Autowired
    private LopCryptoService lopCryptoService;

    @Autowired
    private PrimeIndexService primeIndexService;
    
    @PostMapping("/process-batch")
    public ResponseEntity<List<Map<String, Object>>> processBatch(
            @RequestBody List<Map<String, String>> payload
    ) {
        try {
            List<Map<String, Object>> result = lopCryptoService.processKhoaBatch(payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/process")
    public ResponseEntity<ClassCryptoResult> process(
            @RequestBody ClassCryptoInput input
    ) {
        try {
            String primesLop = lopCryptoService.derivePrimesLop(
                    input.maLop,
                    input.primesKhoa
            );

            System.out.println("Processing MaLop: " + input.maLop + ", primes: " + primesLop);
            
            // Trả về JSON object
            return ResponseEntity.ok(
                    new ClassCryptoResult(input.maLop, primesLop)
            );

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/calculate-index")
    public ResponseEntity<Map<String, Object>> getPrimeIndex(
         @RequestBody PrimeIndexInput input
    ) {
        try {
            long index = primeIndexService.calculatePrimeIndex(
                input.maKhoa, 
                input.maLop, 
                input.mssv
            );

            // Trả về dạng JSON để Postman và Node.js dễ đọc
            Map<String, Object> response = new HashMap<>();
            response.put("mssv", input.mssv);
            response.put("primeIndex", index);
            response.put("status", "success");

        return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}