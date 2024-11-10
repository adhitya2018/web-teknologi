import bcrypt from 'bcrypt'; //hash text menggunakan bcrypt
import { db } from '@vercel/postgres'; //panggil conn string ke db
import { invoices, customers, revenue, users } from '../lib/placeholder-data'; //panggil file dump data

const client = await db.connect(); //buka koneksi ke db

//fungsi dump data user
async function seedUsers() {
  //buat fungsi generate UUID
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  //buat tabel users
  await client.sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;
  //fungsi insert ke tabel users
  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10); //hash kata sandi menggunakan bcrypt
      return client.sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}

//fungsi dump data invoice
async function seedInvoices() {
  //buat fungsi generate UUID
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  //buat tabel invoices 
  await client.sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;
  //fungsi insert ke tabel invoices
  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => client.sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedInvoices;
}

//fungsi dump data customer
async function seedCustomers() {
  //buat fungsi generate UUID
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  //buat tabel customers
  await client.sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;
  //fungsi insert ke tabel customers
  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => client.sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedCustomers;
}

//fungsi dump data invoice
async function seedRevenue() {
  //buat tabel revenue
  await client.sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
  //fungsi insert ke tabel revenue
  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => client.sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
    ),
  );

  return insertedRevenue;
}

export async function GET() {
  // return Response.json({
  //   message:
  //     'Uncomment this file and remove this line. You can delete this file when you are finished.',
  // });
  try {
    await client.sql`BEGIN`;
    await seedUsers(); //panggil fungsi dump data user
    await seedCustomers(); //panggil fungsi dump data customer
    await seedInvoices(); //panggil fungsi dump data invoice
    await seedRevenue(); //panggil fungsi dump data revenue
    await client.sql`COMMIT`; //lakukan commit 

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    await client.sql`ROLLBACK`; //jika terjadi error dilakukan rollback
    return Response.json({ error }, { status: 500 });
  }
}
