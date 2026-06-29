package com.example.crypto.service.lop;

import org.springframework.stereotype.Service;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LopCryptoService {

    public List<Map<String, Object>> processKhoaBatch(List<Map<String, String>> listKhoa) {
        List<Map<String, Object>> results = new ArrayList<>();
        SecureRandom rnd = new SecureRandom();

        for (Map<String, String> item : listKhoa) {
            String maKhoa = item.get("maKhoa");
            try {
                // 1. Sinh M ngẫu nhiên (2048 bit)
                BigInteger M = new BigInteger(2048, rnd);

                // 2. Sinh 10 số nguyên tố
                List<BigInteger> primes = new ArrayList<>();
                for(int i=0; i<10; i++) {
                    primes.add(BigInteger.probablePrime(128, rnd));
                }

                // 3. Tính C_khoa = M mod p_i
                List<String> encryption = new ArrayList<>();
                for (BigInteger p : primes) {
                    encryption.add(M.mod(p).toString());
                }

                Map<String, Object> res = new HashMap<>();
                res.put("maKhoa", maKhoa);
                res.put("primes", primes.stream().map(BigInteger::toString).collect(Collectors.toList()));
                res.put("encryption", encryption);
                
                results.add(res);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return results;
    }
    /**
     * primes_lop = SHA256(primes_khoa || maLop)
     */
    public String derivePrimesLop(
            String maLop,
            List<String> primesKhoa
    ) throws Exception {

        MessageDigest md = MessageDigest.getInstance("SHA-256");

        StringBuilder sb = new StringBuilder();

        for (String p : primesKhoa) {
            sb.append(p);
        }

        sb.append(maLop.trim());

        byte[] hash = md.digest(
                sb.toString().getBytes(StandardCharsets.UTF_8)
        );

        return bytesToHex(hash);
    }

    // Tính primes_sv = SHA256(primes_lop + mssv)
    public BigInteger derivePrimesSV(String primesLop, String mssv) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        String input = primesLop + mssv; 
        
        byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
        
        return new BigInteger(1, hash);
    }

    // Tính C_sv = C_khoa mod primes_sv
    public List<String> calculateStudentKey(List<String> cKhoaList, BigInteger primesSv) {
        List<String> cSvList = new ArrayList<>();
        for (String cKhoaStr : cKhoaList) {
            BigInteger cKhoa = new BigInteger(cKhoaStr);
            // Phép tính cốt lõi
            BigInteger cSv = cKhoa.mod(primesSv);
            cSvList.add(cSv.toString());
        }
        return cSvList;
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // Hàm main test thử 
    public static void main(String[] args) throws Exception {
        // Giả lập dữ liệu test
        List<String> primesKhoa = List.of(
                "123456789123456789",
                "987654321987654321"
        );
        String maLop = "D21CNTT01";

        LopCryptoService service = new LopCryptoService();
        String primesLop = service.derivePrimesLop(maLop, primesKhoa);

        System.out.println("primes_lop = " + primesLop);
    }
}