#!/usr/bin/env python3
"""
Extract input code from shed test files and save them to test_files directory.
Unused now, still useful for the future.
"""

import pathlib
import re

def extract_inputs():
    """Extract input code from shed recorded test files."""
    # Source directory
    recorded_dir = pathlib.Path("vendor/shed/tests/recorded")

    # Target directory
    target_dir = pathlib.Path("test_files/shed_inputs")
    target_dir.mkdir(parents=True, exist_ok=True)

    # Separator used in shed test files
    joiner = "\n\n" + "=" * 80 + "\n\n"

    # Process each recorded test file
    for test_file in recorded_dir.glob("*.txt"):
        print(f"Processing {test_file.name}...")

        content = test_file.read_text()

        # Split on the separator and get the input part
        parts = (content + joiner).split(joiner)
        if len(parts) >= 2:
            input_code = parts[0].strip()

            # Create output filename - change .txt to .py for Python files
            output_name = test_file.stem
            if input_code and not input_code.startswith('#') or 'import ' in input_code or 'def ' in input_code or 'class ' in input_code:
                output_file = target_dir / f"{output_name}.py"
            else:
                output_file = target_dir / f"{output_name}.txt"

            # Write the input code
            output_file.write_text(input_code + "\n")
            print(f"  -> {output_file}")
        else:
            print(f"  -> Skipped (no separator found)")

if __name__ == "__main__":
    extract_inputs()
