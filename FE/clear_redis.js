const Redis = require('ioredis');

const client = new Redis({
  host: 'redis-18776.c295.ap-southeast-1-1.ec2.cloud.redislabs.com',
  port: 18776,
  password: 'hOZZEVxdxlcsc5rs6Wqf0OSSJO5NWeWc',
});

async function run() {
  try {
    console.log('Connecting to Redis...');
    await client.ping();
    console.log('Connected!');

    console.log('Flushing all data...');
    await client.flushall();
    console.log('Cache cleared successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

run();
