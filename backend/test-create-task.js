const http = require('http');

const data = JSON.stringify({
  title: 'Test Auto Invite',
  workspaceId: '82554491-374b-480d-bbce-157da115b87d',
  assigneeEmail: 'test-curl2@example.com'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/tasks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer test'
  }
};

const req = http.request(options, (res) => {
  let chunks = [];
  res.on('data', d => chunks.push(d));
  res.on('end', () => console.log(Buffer.concat(chunks).toString()));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
