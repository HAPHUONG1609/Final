with open("final.txt", "r") as fin, open("primes.txt", "w") as fout:
    for line in fin:
        cols = line.strip().split()
        if len(cols) >= 2:
            fout.write(cols[1] + "\n")