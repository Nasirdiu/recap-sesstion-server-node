const express = require("express");
const app = express();
var cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//dbuser3
//CCgoQtMV7upfKQdC

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.urjsr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const useCollection = client.db("bike").collection("product");
    const orderCollection = client.db("bike").collection("orders");

    //jwt
    app.post("/login", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
      res.send({ token });
    });

    //upload
    app.post("/uploadPd", async (req, res) => {
      const product = req.body;
      const tokenInfo = req.headers.authorization;
      // console.log(tokenInfo);
      const [email, accessToken] = tokenInfo.split(" ");
      const decoded = verifyToken(accessToken);
      // console.log(decoded);
      if (email === decoded.email) {
        const result = await useCollection.insertOne(product);
        res.send(result);
      } else {
        res.send({ success: "unautize" });
      }
    });
    app.get("/product", async (req, res) => {
      const product = await useCollection.find({}).toArray();
      res.send(product);
    });

    app.post("/addOrder", async (req, res) => {
      const orderInfo = req.body;
      const result = await orderCollection.insertOne(orderInfo);
      res.send({ success: "order complete" });
    });

    //order list
    app.get("/orderList", async (req, res) => {
      const tokenInfo = req.headers.authorization;
      // console.log(tokenInfo)
      const [email, accessToken] = tokenInfo.split(" ");
      // console.log(email, accessToken)
      const decoded = verifyToken(accessToken);
      if (email === decoded.email) {
        const orders = await orderCollection.find({ email: email }).toArray();
        res.send(orders);
      } else {
        res.send({ success: "UnAuthoraized Access" });
      }
    });
    
    //delete
    app.delete("/product", async (req, res) => {
      const id = req.body;
      const result = await useCollection.deleteOne(id);
      res.send({success:'Delete success'});
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running Server");
});

app.listen(port, () => {
  console.log("CRUD is running", port);
});

function verifyToken(token) {
  let email;
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      email = "invalid";
    }
    if (decoded) {
      // console.log(decoded);
      email = decoded;
    }
  });
  return email;
}
