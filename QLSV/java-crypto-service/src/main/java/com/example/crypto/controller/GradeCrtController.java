package com.example.crypto.controller;

import com.example.crypto.grade.GradeCrtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/crypto/grade-crt")
public class GradeCrtController {

    private final GradeCrtService gradeCrtService;

    @Autowired
    public GradeCrtController(GradeCrtService gradeCrtService) {
        this.gradeCrtService = gradeCrtService;
    }

    /*
     * API tính lại startIndex/endIndex.
     *
     * Node gửi:
     * {
     *   "maKhoa": "...",
     *   "maLop": "...",
     *   "mssv": "...",
     *   "maHp": "...",
     *   "pin": "...",
     *   "publicKey": "..." hoặc "svPublicKey": "..."
     * }
     */
    @PostMapping("/prime-range")
    public ResponseEntity<?> layKhoangSNT(@RequestBody Map<String, Object> body) {
        try {
            String maKhoa = getRequiredString(body, "maKhoa");
            String maLop = getRequiredString(body, "maLop");
            String mssv = getRequiredString(body, "mssv");
            String maHp = getRequiredString(body, "maHp");
            String pin = getRequiredString(body, "pin");

            String publicKey = getOptionalString(body, "publicKey");
            if (publicKey == null) {
                publicKey = getRequiredString(body, "svPublicKey");
            }

            long N = 5_000_000L;

            String sharedSecret = gradeCrtService.tinhSharedSecret(publicKey, pin);

            long startIndex = gradeCrtService.tinhStartIndex(
                    maKhoa,
                    maLop,
                    mssv,
                    maHp,
                    N,
                    sharedSecret
            );

            long endIndex = startIndex + GradeCrtService.NUMBER_OF_GRADES - 1;

            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("mssv", mssv);
            result.put("maHp", maHp);
            result.put("startIndex", startIndex);
            result.put("endIndex", endIndex);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return buildErrorResponse(e, body);
        }
    }

    /*
     * API mã hóa CRT.
     *
     * Node gửi:
     * {
     *   "mssv": "sv001",
     *   "diem": [85, 70, 78],
     *   "primes": ["101", "103", "107"]
     * }
     */
    @PostMapping("/encrypt")
    public ResponseEntity<?> maHoaDiemCRT(@RequestBody Map<String, Object> body) {
        try {
            String mssv = getRequiredString(body, "mssv");

            List<Integer> diem = getIntegerList(body, "diem");
            List<BigInteger> primes = getBigIntegerList(body, "primes");

            BigInteger C = gradeCrtService.maHoaCRT(diem, primes);

            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("mssv", mssv);
            result.put("C", C.toString());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return buildErrorResponse(e, body);
        }
    }

    /*
     * API giải mã CRT.
     *
     * Node gửi:
     * {
     *   "mssv": "sv001",
     *   "C": "...",
     *   "primes": ["101", "103", "107"]
     * }
     *
     * Java trả:
     * plaintext[0] = C mod primes[0]
     * plaintext[1] = C mod primes[1]
     * plaintext[2] = C mod primes[2]
     */
    @PostMapping("/decrypt")
    public ResponseEntity<?> decrypt(@RequestBody Map<String, Object> body) {
        try {
            String mssv = getRequiredString(body, "mssv");
            String C = getRequiredString(body, "C");
            List<String> primes = getStringList(body, "primes");

            List<Integer> plaintext = gradeCrtService.giaiMaCRT(C, primes);

            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("mssv", mssv);
            result.put("C", C);
            result.put("primes", primes);
            result.put("plaintext", plaintext);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return buildErrorResponse(e, body);
        }
    }

    private String getOptionalString(Map<String, Object> body, String key) {
        Object value = body.get(key);

        if (value == null || value.toString().trim().isEmpty()) {
            return null;
        }

        return value.toString().trim();
    }

    private String getRequiredString(Map<String, Object> body, String key) {
        Object value = body.get(key);

        if (value == null || value.toString().trim().isEmpty()) {
            throw new IllegalArgumentException("Thiếu field: " + key);
        }

        return value.toString().trim();
    }

    private List<String> getStringList(Map<String, Object> body, String key) {
        Object value = body.get(key);

        if (!(value instanceof List<?>)) {
            throw new IllegalArgumentException("Thiếu hoặc sai định dạng field: " + key);
        }

        List<?> rawList = (List<?>) value;

        if (rawList.isEmpty()) {
            throw new IllegalArgumentException("Danh sách " + key + " rỗng");
        }

        return rawList.stream()
                .map(item -> {
                    if (item == null || item.toString().trim().isEmpty()) {
                        throw new IllegalArgumentException("Danh sách " + key + " chứa giá trị rỗng");
                    }

                    return item.toString().trim();
                })
                .toList();
    }

    private List<Integer> getIntegerList(Map<String, Object> body, String key) {
        Object value = body.get(key);

        if (!(value instanceof List<?>)) {
            throw new IllegalArgumentException("Thiếu hoặc sai định dạng field: " + key);
        }

        List<?> rawList = (List<?>) value;

        if (rawList.isEmpty()) {
            throw new IllegalArgumentException("Danh sách " + key + " rỗng");
        }

        return rawList.stream()
                .map(item -> {
                    if (item == null || item.toString().trim().isEmpty()) {
                        throw new IllegalArgumentException("Danh sách " + key + " chứa giá trị rỗng");
                    }

                    try {
                        if (item instanceof Number) {
                            return ((Number) item).intValue();
                        }

                        return Integer.parseInt(item.toString().trim());
                    } catch (NumberFormatException e) {
                        throw new IllegalArgumentException(
                                "Giá trị trong " + key + " không phải số nguyên: " + item
                        );
                    }
                })
                .toList();
    }

    private List<BigInteger> getBigIntegerList(Map<String, Object> body, String key) {
        List<String> values = getStringList(body, key);

        return values.stream()
                .map(value -> {
                    try {
                        return new BigInteger(value);
                    } catch (NumberFormatException e) {
                        throw new IllegalArgumentException(
                                "Giá trị trong " + key + " không phải BigInteger hợp lệ: " + value
                        );
                    }
                })
                .toList();
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(Exception e, Map<String, Object> body) {
        e.printStackTrace();

        Map<String, Object> error = new HashMap<>();
        error.put("status", "error");
        error.put("message", e.getMessage());
        error.put("error", e.getClass().getSimpleName());
        error.put("body", body);

        return ResponseEntity.status(500).body(error);
    }


    @PostMapping("/public-key")
    public ResponseEntity<?> taoPublicKey(@RequestBody Map<String, Object> body) {
        try {
            String pin = getRequiredString(body, "pin");

            String publicKey = gradeCrtService.tinhKhoaCongKhai(pin);

            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("publicKey", publicKey);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return buildErrorResponse(e, body);
        }
    }
}