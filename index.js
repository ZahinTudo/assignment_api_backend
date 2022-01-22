const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

//database link
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cufy6.mongodb.net/sample_airbnb?retryWrites=true&w=majority`;

//connecting the client
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const db = client.db("sample_airbnb");
    const listingsAndReviews = db.collection("listingsAndReviews");

    app.get("/sample", async (req, res) => {
      const data = listingsAndReviews.find({}).limit(3);
      const items = await data.toArray();
      res.send(items);
    });

    //filter
    app.get("/filter", async (req, res) => {
      // query object
      const query = {};
      const skip = (req.query.page - 1) * 20 || 0;

      const sort = req.query.sort || 1;

      if (req.query.country) query["address.country"] = req.query.country;
      if (req.query.suburb) query["address.suburb"] = req.query.suburb;
      if (req.query.property_type)
        query["property_type"] = req.query.property_type;
      if (req.query.room_type) query["room_type"] = req.query.room_type;
      if (req.query.beds) query["beds"] = parseInt(req.query.beds);

      const data = listingsAndReviews
        .find(query)
        .skip(skip)
        .limit(20)
        .sort({ price: sort });

      const items = await data.toArray();
      res.send(items);
    });

    //locations
    app.get("/locations", async (req, res) => {
      const country = req.query.country;
      const coords = JSON.parse(req.query.coordinates);
      console.log(country, coords);
      const data = listingsAndReviews
        .find({
          $and: [
            { "address.country": country },
            {
              "address.location": {
                $near: {
                  $geometry: {
                    type: "Point",
                    coordinates: coords,
                  },
                  $maxDistance: 5000,
                },
              },
            },
          ],
        })
        .limit(5);
      const items = await data.toArray();
      res.send(items);
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

// Server checking

app.get("/", (req, res) => {
  res.send("Running backend Server");
});

app.listen(port, () => {
  console.log("Running destino Server on port", port);
});
