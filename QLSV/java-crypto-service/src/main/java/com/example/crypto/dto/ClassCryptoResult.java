package com.example.crypto.dto;

public class ClassCryptoResult {
    public String maLop;
    public String primesLop; // Kết quả hash của lớp

    public ClassCryptoResult() {}

    public ClassCryptoResult(String maLop, String primesLop) {
        this.maLop = maLop;
        this.primesLop = primesLop;
    }
}