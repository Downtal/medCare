import { createServer } from 'http';

const server = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    console.log(`[Mock Server] ${req.method} ${req.url} | Body: ${body}`);

    // Handle Login (for NextAuth authorize)
    if (req.url.includes('/auth-service/api/auth/login') && req.method === 'POST') {
      const { username, password } = JSON.parse(body || '{}');
      
      if (username === 'test@example.com' && password === 'password123') {
        res.statusCode = 200;
        res.end(JSON.stringify({
          username: 'testuser',
          fullName: 'Test User',
          email: 'test@example.com',
          accessToken: 'fake-access-token',
          refreshToken: 'fake-refresh-token',
          expiresIn: 3600,
          userId: 1,
          role: 'USER'
        }));
      } else {
        res.statusCode = 401;
        res.end(JSON.stringify({ message: 'Tài khoản hoặc mật khẩu không chính xác.' }));
      }
      return;
    }

    // Handle Profile (for Header fullName fetch)
    if (req.url.includes('/user-service/api/users/profiles/me')) {
      res.end(JSON.stringify({
        fullName: 'Test User',
        userId: 1
      }));
      return;
    }

    // Handle Category Tree
    if (req.url.includes('/product-service/api/categories/tree')) {
      res.end(JSON.stringify([]));
      return;
    }

    // Handle Cart Merge
    if (req.url.includes('/order-service/api/cart/merge')) {
      res.end(JSON.stringify({ message: 'Cart merged' }));
      return;
    }

    // Default response
    if (!res.writableEnded) {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: 'Not Found' }));
    }
  });
});

server.listen(8080, '127.0.0.1', () => {
  console.log('Mock server listening on http://127.0.0.1:8080');
});
