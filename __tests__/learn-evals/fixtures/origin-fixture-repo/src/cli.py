"""CLI entrypoint — Python half of origin-fixture-repo.

The "QUICK-REFERENCE" fixture doc cites this file at line 12 (main()).
"""
import sys


def parse_args(argv):
    return {"verbose": "--verbose" in argv}


def main(argv=None):
    args = parse_args(argv or sys.argv[1:])
    print("running" if args["verbose"] else "quiet")
    return 0


if __name__ == "__main__":
    sys.exit(main())
