# Load Testing with k6

This directory contains load testing scenarios for StitchCraft using [k6](https://k6.io/).

## Installation

```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Scenarios

### 1. API Stress Test (`api-stress.js`)
Tests general API endpoint performance under load.

```bash
k6 run src/__tests__/load/scenarios/api-stress.js
```

**Configuration:**
- Ramps up to 100 concurrent users over 4 minutes
- Target: 95% of requests under 500ms
- Error rate threshold: < 1%

### 2. Concurrent Orders (`concurrent-orders.js`)
Simulates multiple tailors creating orders simultaneously.

```bash
# With authentication (required for order creation)
TEST_SESSION=<your-session-cookie> k6 run src/__tests__/load/scenarios/concurrent-orders.js
```

**Configuration:**
- Ramps up to 50 concurrent tailors
- Tests database write concurrency
- Target: 95% of order creations under 2s

### 3. Payment Burst (`payment-burst.js`)
Tests payment system under high-volume conditions.

```bash
k6 run src/__tests__/load/scenarios/payment-burst.js
```

**Configuration:**
- 50 payment verifications per second for 1 minute
- Tests Paystack webhook capacity
- Target: 95% under 1s, < 1% errors

## Running Against Production

```bash
# Set custom base URL
BASE_URL=https://www.stitchcraft.live k6 run src/__tests__/load/scenarios/api-stress.js
```

## Running Against Local

```bash
# Start the dev server first
npm run dev

# Run tests against localhost
BASE_URL=http://localhost:3000 k6 run src/__tests__/load/scenarios/api-stress.js
```

## Cloud Execution (Optional)

```bash
# Login to k6 Cloud
k6 login cloud

# Run with cloud reporting
k6 run --out cloud src/__tests__/load/scenarios/api-stress.js
```

## Interpreting Results

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| P95 Response Time | < 500ms | 500-1000ms | > 1000ms |
| Error Rate | < 1% | 1-5% | > 5% |
| Request Rate | > 100/s | 50-100/s | < 50/s |

## Adding New Scenarios

1. Create a new `.js` file in `scenarios/`
2. Export `options` with stages and thresholds
3. Export default function with test logic
4. Document the scenario in this README
