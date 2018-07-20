#!/usr/bin/env python3
from subprocess import call
from glob import glob

def main():
    test_files = glob('test/**/*.test.js', recursive=True)

    success = 0
    failed = 0

    for test_file in test_files:
        print(f'✨   Start Test: {test_file}')
        retcode = call(['iotjs', test_file])
        if retcode is not 0:
            failed += 1
            print(f'💀   Failed: {test_file}')
        else:
            success += 1
            print(f'💃   Success: {test_file}')

    if failed > 0:
        exit(1)


if __name__ == '__main__':
    main()
