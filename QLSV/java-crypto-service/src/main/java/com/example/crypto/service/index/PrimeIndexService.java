package com.example.crypto.service.index;

import org.springframework.stereotype.Service;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class PrimeIndexService {

    // Giả định DB có 5 triệu số nguyên tố và thang điểm cao nhất là 10
    private static final long TOTAL_PRIMES_N = 5000000;
    private static final long MAX_GRADE_M = 10;

    public long calculatePrimeIndex(String maKhoa, String maLop, String mssv) throws Exception {
        String infoSeed = mssv.trim() + maKhoa.trim() + maLop.trim();

        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = md.digest(infoSeed.getBytes(StandardCharsets.UTF_8));

        BigInteger hashValue = new BigInteger(1, hashBytes);
        BigInteger space = BigInteger.valueOf(TOTAL_PRIMES_N - MAX_GRADE_M);
        
        BigInteger k = hashValue.mod(space);
        BigInteger index = k.add(BigInteger.valueOf(MAX_GRADE_M));

        return index.longValue();
    }
}