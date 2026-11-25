#!/usr/bin/env bash
# Capture a clean end-to-end demo run for the hackathon video.
# Produces out/demo-run.txt with the exact terminal narrative shown in the video.
set -u
cd "$(dirname "$0")/.."
OUT=out/demo-run.txt
: > "$OUT"

line() { printf '%s\n' "$1" | tee -a "$OUT"; sleep "${2:-0.8}"; }

pkill -f 'src/facilitator.mjs' 2>/dev/null; pkill -f 'src/server.mjs' 2>/dev/null; sleep 1
nohup node src/facilitator.mjs > out/facilitator.log 2>&1 &
FAC=$!
nohup node src/server.mjs > out/server.log 2>&1 &
SRV=$!
sleep 4

line '$ node src/facilitator.mjs &' 1.2
line "ProofSight x402 facilitator on :8402 (settles payments, sponsors network fees)" 1.2
line '$ node src/server.mjs &' 1.2
line "ProofSight seller on :3000 (badge JyP9XuZ1MiqWZV82gCRTo, Active in the Concordium Agent Registry)" 1.6
line '' 0.4
line '$ node scripts/buyer.mjs' 1.6

node scripts/buyer.mjs 2>&1 | while IFS= read -r l; do printf '%s\n' "$l" | tee -a "$OUT"; sleep 0.9; done

line '' 0.4
line '# The report hash above is anchored on-chain (RegisterData) - a permanent audit record.' 2
kill $FAC $SRV 2>/dev/null
echo "captured to $OUT"
