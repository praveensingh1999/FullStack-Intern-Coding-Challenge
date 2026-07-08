require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');



const app = express();
app.use(cors());
app.use(express.json());



// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    // In production, use migrations instead of sync(). alter:true is convenient for this challenge.
    await sequelize.sync({ alter: true });
    console.log('Database connected and synced');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
}

start();
