package com.example.crypto.service.crt;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

public class CRT {
    public static final int FAC = 10;

    public static BigInteger stringToBigInteger(String s) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-512");
        byte[] hash = md.digest(s.getBytes(StandardCharsets.UTF_8));
        return new BigInteger(1, hash);
    }

    public static List<BigInteger> encryptCRT(String data, int k, List<String> primes) throws Exception {
        List<BigInteger> ciphertext = new ArrayList<>();
        BigInteger M = stringToBigInteger(data);

        for (int i = 0; i < k; i++) {
            BigInteger p = CreatePrime.generatePrime(data + "_salt_" + i, 256);
            primes.add(p.toString());
            ciphertext.add(M.mod(p));
        }
        return ciphertext;
    }

    public static List<String> result(String maKhoa, List<String> primes) throws Exception {
        List<BigInteger> list = encryptCRT(maKhoa, FAC, primes);
        List<String> res = new ArrayList<>();
        for (BigInteger b : list) {
            res.add(b.toString());
        }
        return res;
    }
}
