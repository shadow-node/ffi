#!/usr/bin/env python3
from subprocess import call
from os import environ
from glob import glob

def main():
    test_files = glob('test/*.test.js')
    for test_files in test_files:
        retcode = call(['iotjs', test_files])
        if retcode is not 0:
            exit(retcode)

if __name__ == '__main__':
    main()
