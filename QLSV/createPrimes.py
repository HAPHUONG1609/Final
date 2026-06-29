LIMIT = 86_100_000
TARGET = 5_000_000

sieve = bytearray(b"\x01") * (LIMIT + 1)
sieve[0:2] = b"\x00\x00"

for i in range(2, int(LIMIT ** 0.5) + 1):
    if sieve[i]:
        sieve[i*i : LIMIT+1 : i] = b"\x00" * (((LIMIT - i*i)//i) + 1)

with open("final.txt", "w") as f:
    idx = 1
    for p in range(101, LIMIT + 1):
        if sieve[p]:
            f.write(f"{idx}\t{p}\n")
            idx += 1
            if idx > TARGET:
                break

print("Hoàn thành 5.000.000 số nguyên tố.")