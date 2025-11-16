import axios from 'axios';

const API_URL = 'http://localhost:4000';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';

async function testDashboardCache() {
  console.log('Testing Dashboard Cache Fix...\n');

  try {
    // Make first request
    console.log('Making first request to /api/dashboard/metrics...');
    const response1 = await axios.get(`${API_URL}/api/dashboard/metrics`, {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });

    console.log('First Response Headers:');
    console.log('- Cache-Control:', response1.headers['cache-control']);
    console.log('- Pragma:', response1.headers['pragma']);
    console.log('- Expires:', response1.headers['expires']);
    console.log('- Status:', response1.status);
    console.log('- Data (overdue):', response1.data.data?.overdueAmounts);

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Make second request (should NOT return 304)
    console.log('\nMaking second request to /api/dashboard/metrics...');
    const response2 = await axios.get(`${API_URL}/api/dashboard/metrics`, {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });

    console.log('Second Response:');
    console.log('- Status:', response2.status);
    console.log('- Data (overdue):', response2.data.data?.overdueAmounts);

    if (response2.status === 304) {
      console.error('\n❌ FAIL: Still getting 304 Not Modified response!');
    } else if (response2.status === 200) {
      console.log('\n✅ SUCCESS: Getting fresh data with 200 OK response!');
      console.log('Cache headers are preventing browser caching.');
    }
  } catch (error) {
    console.error('Error testing dashboard cache:', error);
    console.log('\nPlease ensure:');
    console.log('1. Backend is running on port 4000');
    console.log('2. You have a valid auth token set in TEST_AUTH_TOKEN env variable');
    console.log('3. Run: TEST_AUTH_TOKEN="your-token" npx ts-node test-dashboard-cache.ts');
  }
}

testDashboardCache();
