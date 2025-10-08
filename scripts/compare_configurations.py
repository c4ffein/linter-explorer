#!/usr/bin/env python3
"""
Compare different tool configurations to show their distinct behaviors.
"""

import sys
import subprocess
import black
from pathlib import Path

def main(verify_only=False):
    test_file = Path(__file__).parent.parent / "test_files" / "broken_python.py"
    original_code = test_file.read_text()
    outputs_dir = Path(__file__).parent.parent / "test_files" / "outputs"

    print("🔧 Testing Different Tool Configurations:")
    print(f"📁 Original: {len(original_code)} chars")
    print()

    # 1. Ruff format only (should match Black)
    print("1️⃣ Ruff format (Black-compatible)...")
    result = subprocess.run(["ruff", "format", "--stdin-filename", "test.py"],
                          input=original_code, encoding="utf-8", capture_output=True)
    ruff_format_only = result.stdout
    print(f"   Result: {len(ruff_format_only)} chars")

    # 2. Black only
    print("2️⃣ Black format...")
    black_mode = black.Mode(target_versions={black.TargetVersion.PY39})
    black_only = black.format_str(original_code, mode=black_mode)
    print(f"   Result: {len(black_only)} chars")

    # 3. Ruff check --fix-only (with limited rules, no import removal)
    print("3️⃣ Ruff check --fix-only (no import removal)...")
    result = subprocess.run([
        "ruff", "check", "--select=E,W,F841", "--fix-only", "--exit-zero", "-"
    ], input=original_code, encoding="utf-8", capture_output=True)
    ruff_fix_no_imports = result.stdout
    print(f"   Result: {len(ruff_fix_no_imports)} chars")

    # 4. Ruff check --fix-only (with import removal)
    print("4️⃣ Ruff check --fix-only (with import removal)...")
    result = subprocess.run([
        "ruff", "check", "--select=F401,F841,I", "--fix-only", "--exit-zero", "-"
    ], input=original_code, encoding="utf-8", capture_output=True)
    ruff_fix_with_imports = result.stdout
    print(f"   Result: {len(ruff_fix_with_imports)} chars")

    # 5. Shed formatting (both with and without refactor)
    print("5️⃣ Shed format (no refactor)...")
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent / "vendor" / "shed" / "src"))
    import shed as shed_module
    shed_result_no_refactor = shed_module.shed(original_code, refactor=False)
    print(f"   Result: {len(shed_result_no_refactor)} chars")

    print("6️⃣ Shed format (with refactor)...")
    shed_result_with_refactor = shed_module.shed(original_code, refactor=True)
    print(f"   Result: {len(shed_result_with_refactor)} chars")


    print()
    print("📊 Comparison Results:")
    print(f"📁 Original:                    {len(original_code):4d} chars")
    print(f"🔧 Ruff format only:            {len(ruff_format_only):4d} chars")
    print(f"🖤 Black only:                  {len(black_only):4d} chars")
    print(f"⚡ Ruff fix (no imports):       {len(ruff_fix_no_imports):4d} chars")
    print(f"🧹 Ruff fix (with imports):     {len(ruff_fix_with_imports):4d} chars")
    print(f"🏠 Shed (no refactor):          {len(shed_result_no_refactor):4d} chars")
    print(f"🏠 Shed (with refactor):        {len(shed_result_with_refactor):4d} chars")
    print()

    # Prepare outputs map
    outputs = {
        "ruff_format_only.py": ruff_format_only,
        "black_only.py": black_only,
        "ruff_fix_no_imports.py": ruff_fix_no_imports,
        "ruff_fix_with_imports.py": ruff_fix_with_imports,
        "shed_format.py": shed_result_no_refactor,  # Default (matches WASM implementation)
        "shed_format_no_refactor.py": shed_result_no_refactor,
        "shed_format_with_refactor.py": shed_result_with_refactor,
    }

    if verify_only:
        # Verification mode: compare generated outputs with saved files
        print("🔍 Verifying reference files are up-to-date...")
        mismatches = []

        for filename, generated_content in outputs.items():
            reference_file = outputs_dir / filename
            if not reference_file.exists():
                mismatches.append(f"  ❌ {filename}: File does not exist")
                continue

            saved_content = reference_file.read_text()
            if generated_content != saved_content:
                mismatches.append(
                    f"  ❌ {filename}: Content differs "
                    f"(generated: {len(generated_content)} chars, saved: {len(saved_content)} chars)"
                )
            else:
                print(f"  ✅ {filename}")

        if mismatches:
            print()
            print("❌ Reference files are outdated:")
            for mismatch in mismatches:
                print(mismatch)
            print()
            print("Run 'make generate-references' to update them.")
            sys.exit(1)
        else:
            print()
            print("✅ All reference files are up-to-date!")
            return
    else:
        # Generate mode: save outputs to files
        for filename, content in outputs.items():
            (outputs_dir / filename).write_text(content)

        print("💾 Saved all configurations to test_files/outputs/")
        print()
    print("🔍 Verifying all outputs are unique...")

    # Build a map of all outputs with their names
    all_outputs = {
        "Ruff format only": ruff_format_only,
        "Black only": black_only,
        "Ruff fix (no imports)": ruff_fix_no_imports,
        "Ruff fix (with imports)": ruff_fix_with_imports,
        "Shed (no refactor)": shed_result_no_refactor,
        "Shed (with refactor)": shed_result_with_refactor,
    }

    # Find groups of identical outputs
    matching_groups = []
    seen = set()

    for name1, content1 in all_outputs.items():
        if name1 in seen:
            continue

        group = [name1]
        for name2, content2 in all_outputs.items():
            if name1 != name2 and name2 not in seen and content1 == content2:
                group.append(name2)
                seen.add(name2)

        if len(group) > 1:
            matching_groups.append(group)
        seen.add(name1)

    # Report results
    if matching_groups:
        print("❌ Found identical outputs:")
        for group in matching_groups:
            print(f"   • {' == '.join(group)}")
        print()
        raise ValueError(
            f"Expected all formatter outputs to be unique, but found {len(matching_groups)} "
            f"group(s) of matching outputs: {matching_groups}"
        )
    else:
        print("✅ All formatter outputs are unique!")
        print("🎯 SUCCESS: Each tool produces distinct results!")


if __name__ == "__main__":
    # Check for --verify flag
    verify_only = "--verify" in sys.argv
    main(verify_only=verify_only)
