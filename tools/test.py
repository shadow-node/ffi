#!/usr/bin/env python3
from subprocess import call
from glob import glob

def main():
    test_files = glob('test/**/*.test.js', recursive=True)

    total = len(test_files)
    success = 0
    failed = 0
    print(f'1..{total}')

    for idx in range(total):
        test_file = test_files[idx]
        print(f'# ✨   Start Test: {test_file}')
        retcode = call(['iotjs', test_file])
        if retcode is not 0:
            failed += 1
            print(f'not ok {idx + 1} - 💀 {test_file}')
        else:
            success += 1
            print(f'ok {idx + 1} - 💃 {test_file}')

    if failed > 0:
        exit(1)


if __name__ == '__main__':
    main()
