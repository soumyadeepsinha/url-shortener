const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const yup = require('yup')
const monk = require('monk')
const { nanoid } = require('nanoid')
require('dotenv').config()

const database = monk(process.env.MONGO_URI)
const urls = database.get('urls')
urls.createIndex({ slug: 1 }, { unique: true })

const app = express()

app.use(cors())
app.use(helmet())
app.use(morgan('tiny'))
app.use(express.json())

app.use(express.static('./public'))

// app.get('/url/:id', (req, res) => {
//   // TODO: get a short url by id
// })

app.get('/:id', async (req, res, next) => {
  const { id: slug } = req.params
  try {
    const url = await urls.findOne({ slug })
    if (url) {
      res.redirect(url.url)
    }
    res.redirect(`/?error=${slug} not found`)
  } catch (error) {
    res.redirect(`/?error=link not found`)
  }
});

app.post('/url', async (req, res, next) => {
  // TODO: create a short url
  let { slug, url } = req.body;
  try {
    await schema.validate({
      slug, url,
    });
    if (!slug) {
      slug = nanoid(5);
    }
    else {
      const existing = await urls.findOne({ slug });
      if (existing) {
        throw new Error('Slug in use. 🍔');
      }
    }
    slug = slug.toLowerCase();
    const newUrl = {
      url,
      slug,
    };
    const created = await urls.insert(newUrl);
    res.json(created);
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status);
  } else {
    res.status(500);
  }
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? '🎂' : error.stack,
  })
})

const schema = yup.object().shape({
  slug: yup.string().trim().matches(/[\w\-]/i),
  url: yup.string().trim().url().required(),
});

const PORT = process.env.PORT || 1234
app.listen(PORT, () => {
  console.log(`App is started on http://localhost:${PORT}`);
})