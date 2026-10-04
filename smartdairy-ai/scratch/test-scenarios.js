const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('1. Logging in as ADMIN...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@smartdairy.local', password: 'Admin@123' });

  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes);
    process.exit(1);
  }

  const token = loginRes.data.token;
  console.log('Token acquired successfully.');

  const scenarios = [
    'NORMAL_COW',
    'EARLY_WARNING',
    'HIGH_RISK',
    'RFID_MISSED',
    'UNKNOWN_RFID',
    'SENSOR_FAILURE',
    'NETWORK_FAILURE',
    'CIP_CYCLE',
    'MULTI_COW_FLOW',
    'RESET'
  ];

  console.log('\n2. Testing 10 SIH Demo Scenarios...');
  for (const sc of scenarios) {
    const res = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/simulation/scenario',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { scenario: sc });

    console.log(`[${sc}] Status: ${res.status} | Result:`, res.data?.result?.message || res.data?.message || res.data);
  }
}

run().catch(console.error);
