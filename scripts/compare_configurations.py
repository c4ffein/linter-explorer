#!/usr/bin/env python3
"""
Compare different tool configurations to show their distinct behaviors.
"""

import subprocess
import black
from pathlib import Path

def main():
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

    # 5. Real Shed formatting
    print("5️⃣ Shed format...")
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(original_code)
        f.flush()
        temp_path = f.name

    result = subprocess.run(['shed', '--refactor', temp_path],
                          capture_output=True, text=True)
    if result.returncode == 0:
        shed_result = Path(temp_path).read_text()
    else:
        shed_result = original_code  # fallback if shed fails

    Path(temp_path).unlink(missing_ok=True)
    print(f"   Result: {len(shed_result)} chars")


    print()
    print("📊 Comparison Results:")
    print(f"📁 Original:                    {len(original_code):4d} chars")
    print(f"🔧 Ruff format only:            {len(ruff_format_only):4d} chars")
    print(f"🖤 Black only:                  {len(black_only):4d} chars")
    print(f"⚡ Ruff fix (no imports):       {len(ruff_fix_no_imports):4d} chars")
    print(f"🧹 Ruff fix (with imports):     {len(ruff_fix_with_imports):4d} chars")
    print(f"🏠 Shed format:                 {len(shed_result):4d} chars")
    print()

    # Check which ones are identical
    if ruff_format_only == black_only:
        print("✅ Ruff format matches Black exactly (as designed)")
    else:
        print("❌ Ruff format differs from Black!")

    if len(ruff_fix_with_imports) < len(black_only):
        reduction = len(black_only) - len(ruff_fix_with_imports)
        print(f"✅ Ruff with import removal saves {reduction} chars ({reduction/len(black_only)*100:.1f}%)")

    # Assert that all three main formatters produce different results
    print()
    print("🔍 Verifying formatter differences...")
    try:
        assert black_only != ruff_format_only, "Black and Ruff should produce different results"
        print("✅ Black ≠ Ruff")
    except AssertionError:
        print("❌ Black == Ruff (unexpectedly identical)")

    try:
        assert black_only != shed_result, "Black and Shed should produce different results"
        print("✅ Black ≠ Shed")
    except AssertionError:
        print("❌ Black == Shed (unexpectedly identical)")

    try:
        assert ruff_format_only != shed_result, "Ruff and Shed should produce different results"
        print("✅ Ruff ≠ Shed")
    except AssertionError:
        print("❌ Ruff == Shed (unexpectedly identical)")

    # Final assertion that all three are different
    try:
        assert black_only != ruff_format_only != shed_result, "All three formatters should produce different results"
        assert black_only != shed_result, "Black and Shed should be different"
        print("🎯 SUCCESS: All formatters produce distinct results!")
    except AssertionError as e:
        print(f"❌ FAILED: Some formatters produce identical results - {e}")

    # Save distinct outputs for analysis
    outputs = {
        "ruff_format_only.py": ruff_format_only,
        "black_only.py": black_only,
        "ruff_fix_no_imports.py": ruff_fix_no_imports,
        "ruff_fix_with_imports.py": ruff_fix_with_imports,
        "shed_format.py": shed_result,
    }

    for filename, content in outputs.items():
        (outputs_dir / filename).write_text(content)

    print("💾 Saved all configurations to test_files/outputs/")
    print("🔍 Now you can see the exact differences between tools!")

if __name__ == "__main__":
    main()
