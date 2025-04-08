#!/bin/bash

# Array of migration versions
migrations=(
    "20240320000000"
    "20240320000000"
    "20240320000001"
    "20240320000002"
    "20240320000003"
    "20240320000004"
    "20240320000005"
    "20240320000006"
    "20240320000007"
    "20240320"
    "2024032301"
    "2024032302"
    "2024032303"
    "2024032304"
    "2024032305"
    "2024032306"
    "2024032307"
    "2024032308"
    "2024032312"
    "2024032313"
    "2024032315"
    "2024032316"
    "2024032317"
    "2024032318"
    "2024032319"
    "2024032320"
    "2024032321"
    "2024032322"
    "2024032323"
    "2024032324"
    "2024032325"
    "2024032326"
    "2024032327"
    "2024032328"
    "2024032329"
    "2024032330"
    "20240324000000"
    "20240324000001"
    "20240324000001"
    "20240324000002"
    "20240324000002"
    "20240325000000"
    "20240325000000"
    "20240325000000"
    "20240326000000"
    "20250402152037"
    "20250402152038"
    "20250402152039"
)

# Loop through each migration and repair it
for migration in "${migrations[@]}"; do
    echo "Repairing migration: $migration"
    supabase migration repair --status applied "$migration"
done 