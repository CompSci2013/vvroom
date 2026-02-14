#!/bin/bash

# Verify All Tests Script
# Run this after completing all 8 categories to verify coverage

echo "=== Test Coverage Verification ==="
echo ""

SCREENSHOTS_DIR="/home/odin/projects/vvroom/e2e/screenshots"
TESTS_DIR="/home/odin/projects/vvroom/e2e/tests"

# Define all test IDs (excluding R6.x which don't have screenshots)
VISUAL_IDS="V1.1.1 V1.1.2 V1.1.3 V1.1.4 V1.1.5 V1.2.1 V1.2.2 V1.2.3 V1.2.4 V1.2.5 V1.3.1 V1.3.2 V1.3.3 V1.3.4 V1.4.1 V1.4.2 V1.4.3 V1.5.1 V1.5.2 V1.5.3 V1.6.1 V1.6.2 V1.6.3 V1.6.4 V1.6.5 V1.6.6 V1.7.1 V1.7.2 V1.7.3 V1.7.4 V1.7.5 V1.7.6 V1.7.7 V1.8.1 V1.8.2 V1.8.3 V1.9.1 V1.9.2 V1.9.3 V1.9.4 V1.9.5"

URL_CONFORM_IDS="U2.1.1 U2.1.2 U2.1.3 U2.1.4 U2.1.5 U2.1.6 U2.1.7 U2.1.8 U2.1.9 U2.2.1 U2.2.2 U2.2.3 U2.2.4 U2.2.5 U2.2.6 U2.2.7 U2.2.8 U2.2.9 U2.2.10 U2.3.1 U2.3.2 U2.3.3"

URL_CONSIST_IDS="U3.1.1 U3.1.2 U3.1.3 U3.1.4 U3.1.5 U3.1.6 U3.2.1 U3.2.2 U3.2.3 U3.2.4 U3.2.5 U3.3.1 U3.3.2 U3.3.3"

POPOUT_IDS="P4.1.1 P4.1.2 P4.1.3 P4.1.4 P4.1.5 P4.1.6 P4.2.1 P4.2.2 P4.2.3 P4.2.4 P4.2.5 P4.2.6 P4.3.1 P4.3.2 P4.3.3 P4.3.4 P4.4.1 P4.4.2 P4.4.3 P4.4.4 P4.4.5 P4.5.1 P4.5.2 P4.5.3 P4.5.4"

SYNC_IDS="S5.1.1 S5.1.2 S5.1.3 S5.1.4 S5.1.5 S5.1.6 S5.1.7 S5.2.1 S5.2.2 S5.2.3 S5.3.1 S5.3.2 S5.3.3"

ERROR_IDS="E7.1 E7.2 E7.3 E7.4 E7.5 E7.6 E7.7"

VISUAL_VERIFY_IDS="VS8.1.1 VS8.1.2 VS8.1.3 VS8.1.4 VS8.1.5 VS8.2.1 VS8.2.2 VS8.2.3 VS8.2.4 VS8.3.1 VS8.3.2 VS8.3.3 VS8.4.1 VS8.4.2 VS8.4.3"

# Function to check screenshots for a category
check_category() {
    local category_name=$1
    local ids=$2
    local missing=0
    local found=0

    echo "Category: $category_name"
    for id in $ids; do
        if ls "$SCREENSHOTS_DIR/${id}-"*.png 1>/dev/null 2>&1; then
            ((found++))
        else
            echo "  MISSING: $id"
            ((missing++))
        fi
    done

    local total=$((found + missing))
    echo "  Found: $found/$total"
    echo ""

    return $missing
}

# Check each category
total_missing=0

check_category "1 - Visual Appearance" "$VISUAL_IDS"
((total_missing+=$?))

check_category "2 - URL Conformity" "$URL_CONFORM_IDS"
((total_missing+=$?))

check_category "3 - URL Consistency" "$URL_CONSIST_IDS"
((total_missing+=$?))

check_category "4 - Pop-Out Behavior" "$POPOUT_IDS"
((total_missing+=$?))

check_category "5 - Cross-Window Sync" "$SYNC_IDS"
((total_missing+=$?))

echo "Category: 6 - Router Encapsulation"
echo "  (Code analysis tests - no screenshots)"
echo ""

check_category "7 - Error Handling" "$ERROR_IDS"
((total_missing+=$?))

check_category "8 - Visual Verification" "$VISUAL_VERIFY_IDS"
((total_missing+=$?))

# Summary
echo "=== Summary ==="
echo ""

# Count screenshots
screenshot_count=$(ls "$SCREENSHOTS_DIR"/*.png 2>/dev/null | wc -l)
echo "Total screenshots: $screenshot_count"

# Count spec tests
if [ -d "$TESTS_DIR" ]; then
    spec_count=$(grep -r "test('" "$TESTS_DIR"/*.spec.ts 2>/dev/null | wc -l)
    echo "Total spec tests: $spec_count"
fi

echo ""
if [ $total_missing -eq 0 ]; then
    echo "✓ All screenshot tests have corresponding files"
else
    echo "✗ Missing $total_missing screenshots"
fi

echo ""
echo "Expected totals:"
echo "  Screenshots: 130 (134 tests - 4 R6.x code tests)"
echo "  Spec tests: 134"
