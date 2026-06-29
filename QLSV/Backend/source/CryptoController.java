// Controller xử lý BATCH
@PostMapping("/process-batch")
public List<StudentCryptoResult> processBatch(
        @RequestBody List<StudentInput> list) throws Exception {

    List<StudentCryptoResult> result = new ArrayList<>();

    for (StudentInput s : list) {
        String a = CRT.result(s.maKhoa);

        StudentCryptoResult r = new StudentCryptoResult();
        r.maKhoa = s.maKhoa;
        r.cryptoCode = a;

        result.add(r);
    }

    return result;
}
