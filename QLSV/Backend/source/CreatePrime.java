import java.math.BigInteger;
import java.security.SecureRandom;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

public class CreatePrime {
    /**
     * Sinh số nguyên tố có đúng `bits` bit.
     * @param bits số bit (ví dụ 1024)
     * @return BigInteger prime
     */

    public static BigInteger generatePrime(String data, int bits) {
        try{
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] seed = md.digest(data.getBytes(StandardCharsets.UTF_8));
            SecureRandom rnd = new SecureRandom(seed); //deterministic
            return BigInteger.probablePrime(bits, rnd);
        }
        catch (Exception e){
            throw new RuntimeException(e);
        }
    }

    public static void main(String[] args) {
        int bits = 1024;
        String data = "22CQCNTT";
        System.out.println("Generating " + bits + "-bit prime... (this may take a moment)");
        long t0 = System.currentTimeMillis();
        BigInteger prime = generatePrime(data, bits);
        long t1 = System.currentTimeMillis();
        System.out.println("Prime generated in " + (t1 - t0) + " ms");
        System.out.println("Bit length: " + prime.bitLength());
        System.out.println("isProbablePrime(100)? " + prime.isProbablePrime(100));
        System.out.println("Prime (hex): " + prime.toString(16)); // or toString() decimal
    }
    
}
