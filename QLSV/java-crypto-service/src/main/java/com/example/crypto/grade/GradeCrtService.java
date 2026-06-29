package com.example.crypto.grade;

import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

@Service
public class GradeCrtService {

    // Tham số Diffie-Hellman: P là số nguyên tố 2048-bit chuẩn RFC 3526, G = 2
    private static final BigInteger P = new BigInteger("FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF", 16);
    private static final BigInteger G = BigInteger.valueOf(2);

    public static final int NUMBER_OF_GRADES = 3;
    public static final int MAX_SCORE_X10 = 100;

    // Tính Khóa công khai: Public_Key = G^PIN mod P
    public String tinhKhoaCongKhai(String pin) {
            BigInteger privateKey = new BigInteger(pin);
            return G.modPow(privateKey, P).toString();
        }

    // Tính Shared Secret: K = PublicKey_DoiPhuong^PIN mod P
    public String tinhSharedSecret(String publicKeyDoiPhuong, String pin) {
        BigInteger pubKey = new BigInteger(publicKeyDoiPhuong);
        BigInteger privateKey = new BigInteger(pin);
        return pubKey.modPow(privateKey, P).toString();
    }    

    public long tinhStartIndex(
            String maKhoa,
            String maLop,
            String mssv,
            String maHp,
            long N,
            String sharedSecretKey
    ) throws Exception {

        final String VERSION = "CRT_V1";

        if (maKhoa == null || maLop == null || mssv == null || maHp == null) {
            throw new IllegalArgumentException("Thiếu maKhoa, maLop, mssv hoặc maHp");
        }

        if (sharedSecretKey == null || sharedSecretKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Thiếu sharedSecretKey");
        }

        if (N <= 0) {
            throw new IllegalArgumentException("N không hợp lệ");
        }

        long safeRange = N - MAX_SCORE_X10 - NUMBER_OF_GRADES + 1;

        if (safeRange <= 0) {
            throw new IllegalArgumentException("N quá nhỏ, không đủ số nguyên tố để lấy khóa CRT");
        }

        BigInteger B = hash(
                maKhoa.trim() + "|" +
                maLop.trim() + "|" +
                mssv.trim().toLowerCase() + "|" +
                maHp.trim().toUpperCase() + "|" +
                VERSION + "|" +
                sharedSecretKey.trim()
        );

        long K = B.mod(BigInteger.valueOf(safeRange)).longValue();

        return K + MAX_SCORE_X10;
    }

    
    public BigInteger maHoaCRT(List<Integer> diem, List<BigInteger> primes) {

        if (diem == null || primes == null) {
            throw new IllegalArgumentException("Thiếu danh sách điểm hoặc danh sách số nguyên tố");
        }

        if (diem.size() != primes.size()) {
            throw new IllegalArgumentException("Số lượng điểm và số lượng số nguyên tố không khớp");
        }

        if (diem.isEmpty()) {
            throw new IllegalArgumentException("Danh sách điểm rỗng");
        }

        BigInteger M = BigInteger.ONE;

        for (BigInteger p : primes) {
            if (p == null || p.compareTo(BigInteger.ONE) <= 0) {
                throw new IllegalArgumentException("Số nguyên tố không hợp lệ");
            }

            M = M.multiply(p);
        }

        BigInteger C = BigInteger.ZERO;

        for (int i = 0; i < diem.size(); i++) {
            BigInteger ai = BigInteger.valueOf(diem.get(i));
            BigInteger pi = primes.get(i);

            if (ai.compareTo(BigInteger.ZERO) < 0) {
                throw new IllegalArgumentException("Điểm không được âm");
            }

            if (ai.compareTo(pi) >= 0) {
                throw new IllegalArgumentException("Điểm phải nhỏ hơn số nguyên tố tương ứng");
            }

            BigInteger Mi = M.divide(pi);
            BigInteger yi = Mi.modInverse(pi);

            C = C.add(ai.multiply(Mi).multiply(yi));
        }

        return C.mod(M);
    }


    /**
     * Giải mã CRT bằng phép chia lấy dư:
     * plaintext[i] = C mod primes[i]
     */
    public List<BigInteger> giaiMaCRT(BigInteger C, List<BigInteger> primes) {

    if (C == null || primes == null || primes.isEmpty()) {
        throw new IllegalArgumentException("Thiếu C hoặc danh sách số nguyên tố");
    }

    return primes.stream()
            .map(C::mod)
            .toList();
}

    public List<Integer> giaiMaCRT(String C, List<String> primes) {
        BigInteger cNumber = parseNonNegativeBigInteger(C, "C");

        if (primes == null || primes.isEmpty()) {
            throw new IllegalArgumentException("Thiếu danh sách số nguyên tố");
        }

        List<BigInteger> primeNumbers = primes.stream()
                .map(value -> parsePositiveBigInteger(value, "prime"))
                .toList();

        return giaiMaCRT(cNumber, primeNumbers).stream()
                .map(value -> {
                    if (value.compareTo(BigInteger.valueOf(Integer.MAX_VALUE)) > 0) {
                        throw new IllegalArgumentException("Giá trị giải mã vượt quá Integer: " + value);
                    }

                    return value.intValue();
                })
                .toList();
    }

    private void validateCrtInput(List<Integer> diem, List<BigInteger> primes) {
        if (diem == null || primes == null) {
            throw new IllegalArgumentException("Thiếu danh sách điểm hoặc danh sách số nguyên tố");
        }

        if (diem.size() != NUMBER_OF_GRADES) {
            throw new IllegalArgumentException("Cần đúng 3 điểm: GK, CK, TB");
        }

        if (primes.size() != NUMBER_OF_GRADES) {
            throw new IllegalArgumentException("Cần đúng 3 số nguyên tố");
        }

        for (int i = 0; i < diem.size(); i++) {
            Integer score = diem.get(i);
            BigInteger prime = primes.get(i);

            if (score == null) {
                throw new IllegalArgumentException("Điểm tại vị trí " + i + " bị null");
            }

            if (score < 0 || score > MAX_SCORE_X10) {
                throw new IllegalArgumentException("Điểm phải nằm trong khoảng 0 đến 100: " + score);
            }

            if (prime == null || prime.compareTo(BigInteger.ONE) <= 0) {
                throw new IllegalArgumentException("Số nguyên tố tại vị trí " + i + " không hợp lệ");
            }

            if (BigInteger.valueOf(score).compareTo(prime) >= 0) {
                throw new IllegalArgumentException(
                        "Điểm phải nhỏ hơn số nguyên tố tương ứng. score=" + score + ", prime=" + prime
                );
            }
        }
    }

    private String requireText(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Thiếu " + fieldName);
        }
        return value.trim();
    }

    private BigInteger parsePositiveBigInteger(String value, String fieldName) {
        BigInteger number = parseNonNegativeBigInteger(value, fieldName);

        if (number.compareTo(BigInteger.ZERO) <= 0) {
            throw new IllegalArgumentException(fieldName + " phải lớn hơn 0");
        }

        return number;
    }

    private BigInteger parseNonNegativeBigInteger(String value, String fieldName) {
        value = requireText(value, fieldName);

        try {
            BigInteger number = new BigInteger(value);

            if (number.compareTo(BigInteger.ZERO) < 0) {
                throw new IllegalArgumentException(fieldName + " không được âm");
            }

            return number;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(fieldName + " không phải số nguyên hợp lệ: " + value);
        }
    }

        private BigInteger hash(String data) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(data.getBytes(StandardCharsets.UTF_8));

        return new BigInteger(1, digest);
    }
}