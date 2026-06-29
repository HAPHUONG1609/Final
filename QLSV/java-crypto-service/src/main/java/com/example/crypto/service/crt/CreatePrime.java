package com.example.crypto.service.crt;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

public class CreatePrime {

    // Tự implement PRNG deterministic bằng cách hash lặp lại
    private static byte[] pseudoRandomBytes(String seedStr, int length) {
        MessageDigest md;
        try {
            md = MessageDigest.getInstance("SHA-256");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        byte[] seed = seedStr.getBytes(StandardCharsets.UTF_8);
        byte[] output = new byte[length];
        byte[] current = seed.clone();

        int generated = 0;
        while (generated < length) {
            current = md.digest(current);  // Hash lại để sinh byte mới
            int copyLength = Math.min(current.length, length - generated);
            System.arraycopy(current, 0, output, generated, copyLength);
            generated += copyLength;
        }
        return output;
    }

    public static BigInteger generatePrime(String data, int bits) {
        byte[] bytes = pseudoRandomBytes(data, bits / 8);
        BigInteger candidate = new BigInteger(1, bytes);

        candidate = candidate.setBit(bits - 1); // đảm bảo bit length
        candidate = candidate.setBit(0);        // đảm bảo lẻ

        while (!candidate.isProbablePrime(100)) {
            candidate = candidate.add(BigInteger.TWO);
        }
        return candidate;
    }

    // Inner class FixedRandom để probablePrime dùng seed cố định
    private static class FixedRandom extends java.util.Random {
        private final MessageDigest md;
        private byte[] buffer;
        private int pos;

        public FixedRandom(String seedStr) {
            try {
                md = MessageDigest.getInstance("SHA-256");
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
            buffer = seedStr.getBytes(StandardCharsets.UTF_8);
            pos = buffer.length;
        }

        @Override
        protected int next(int bits) {
            if (pos >= buffer.length) {
                buffer = md.digest(buffer);
                pos = 0;
            }
            int val = 0;
            for (int i = 0; i < 4 && bits > 0; i++, bits -= 8) {
                if (pos >= buffer.length) {
                    buffer = md.digest(buffer);
                    pos = 0;
                }
                val <<= 8;
                val |= (buffer[pos++] & 0xff);
            }
            return val >>> (32 - bits);
        }
    }
}