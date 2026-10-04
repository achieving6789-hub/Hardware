const fs = require('fs');
const s = fs.readFileSync('packages/database/prisma/schema.prisma', 'utf8')
  .replace('provider = "sqlite"', 'provider = "postgresql"');
fs.writeFileSync('packages/database/prisma/schema.postgresql.prisma', s);
console.log('Synchronized schema.postgresql.prisma!');
