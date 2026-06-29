import java.math.BigInteger;
import java.util.Queue;
import java.util.LinkedList;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public class CRT {
    public static final int FAC = 10;

    public static BigInteger stringToBigInteger(String s) {
        byte[] bytes = s.getBytes(StandardCharsets.UTF_8);
        return new BigInteger(1, bytes); 
    }

    public static boolean different(Queue<BigInteger> q, BigInteger x) {
        for (BigInteger item : q) {
            if (item.equals(x)) {
                return false;
            }
        }
        return true;
    }

    public static Queue<BigInteger> encryptCRT(String data, int type) {

        Queue<BigInteger> primes = new LinkedList<>();
        BigInteger M = stringToBigInteger(data);

        while (primes.size() < type) {
            BigInteger p = CreatePrime.generatePrime(data, 256);
            if (different(primes, p)) {
                primes.add(p);
            }
        }

        // 2. Tạo queue ciphertext
        Queue<BigInteger> ciphertext = new LinkedList<>();
        for (BigInteger p : primes) {
            ciphertext.add(M.mod(p));
        }
        return ciphertext;
    }
    
    public static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    public static String changeQueueToStringAndHash(Queue q) throws Exception {
        StringBuilder sb = new StringBuilder();
        for (Object s : q) {
            sb.append(s.toString());
        }
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
        String hex = bytesToHex(hash);
        return hex;
    }

    public static Queue<BigInteger> result(String maKhoa) throws Exception {
        Queue<BigInteger> q1 =
            CRT.encryptCRT(maKhoa, FAC);

        return q1;
    }

    public static void main(String[] args) throws Exception {
        String a = result("CNTN");
        System.out.println(a);
    }
}

