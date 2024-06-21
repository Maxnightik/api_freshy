import express from 'express';
import { readFile, writeFile, access } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = 'db.json';
const ORDERS_FILE = 'orders.json';

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// GET /api/goods - повертає дані з файлу db.json
app.get('/api/goods', async (req, res) => {
  try {
    const data = await readFile(DB_FILE, 'utf8');
    const goods = JSON.parse(data);
    res.json(goods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /img/:filename - returns the image file with the given filename
app.get('/img/:filename', async (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(__dirname, 'img', filename);

  try {
    await access(imagePath);
    res.sendFile(imagePath);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'Image not found' });
  }
});

// POST /api/order - оформляє замовлення з полями ім'я, телефон та масив з товарами
app.post('/api/order', async (req, res) => {
  const { name, phone, products } = req.body;

  // Перевірка наявності обов'язкових полів
  if (!name || !phone || !products) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const order = { name, phone, products };

  try {
    // Читання існуючих замовлень із файлу
    const data = await readFile(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(data);

    // Додавання нового замовлення
    orders.push(order);

    // Запис оновлених замовлень у файл
    await writeFile(ORDERS_FILE, JSON.stringify(orders));

    res.json({ message: 'Order placed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Перевірка наявності файлу db.json, та створення з порожнім масивом, якщо файлу немає
access(DB_FILE)
  .catch(() => writeFile(DB_FILE, '[]'))
  .catch(err => {
    console.error(err);
  });

access(ORDERS_FILE)
  .catch(() => writeFile(ORDERS_FILE, '[]'))
  .catch(err => {
    console.error(err);
  });

// Запуск серверу
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
