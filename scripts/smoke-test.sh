#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:?Usage: smoke-test.sh <base-url>}"
FAILURES=0

echo "Running smoke tests against ${BASE_URL}"
echo "========================================="

# Test 1: Health endpoint returns 200 with {"status": "ok"}
echo -n "GET /health... "
HEALTH_RESPONSE=$(curl -sf --max-time 10 "${BASE_URL}/health" || true)
if echo "${HEALTH_RESPONSE}" | grep -q '"status":"ok"'; then
  echo "OK"
else
  echo "FAIL (response: ${HEALTH_RESPONSE:-empty})"
  FAILURES=$((FAILURES + 1))
fi

# Test 2: Frontend loads (HTTP 200)
echo -n "GET /... "
FRONTEND_CODE=$(curl -sf -o /dev/null -w '%{http_code}' --max-time 10 "${BASE_URL}/" || echo "000")
if [ "${FRONTEND_CODE}" = "200" ]; then
  echo "OK"
else
  echo "FAIL (HTTP ${FRONTEND_CODE})"
  FAILURES=$((FAILURES + 1))
fi

# Test 3: HTTPS certificate is valid
echo -n "HTTPS certificate... "
if curl -sf --head --max-time 10 "${BASE_URL}" > /dev/null 2>&1; then
  echo "OK"
else
  echo "FAIL"
  FAILURES=$((FAILURES + 1))
fi

echo "========================================="
if [ "${FAILURES}" -gt 0 ]; then
  echo "${FAILURES} test(s) failed"
  exit 1
fi
echo "All smoke tests passed"
