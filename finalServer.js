const path = require("path");
const express = require("express");
const fs = require("fs");
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config({
   path: path.resolve(__dirname, ".env"),
});
const { MongoClient, ServerApiVersion } = require("mongodb");
const { error, table } = require("console");
let portNumber = 3000;

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));
app.use(bodyParser.urlencoded({extended:false}));

const uri = process.env.MONGO_CONNECTION_STRING;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
const MONGO_DB_NAME = "CMSC335DB";
const MONGO_COLLECTION = "finalproject";

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "src")));

//types:

//grocery type
class Grocery {
   _name;
   _quantity;
   _priceper;
   _total;
   constructor(name, quantity, priceper) {
      this._name = name;
      this._quantity = quantity;
      this._priceper = priceper;
      this._total = quantity*priceper;
   }

   get name() {
      return this._name;
   }

   set name(name) {
      this._name = name;
   }

   get quantity() {
      return this._quantity;
   }

   set quantity(quant) {
      this._quantity = quant;
   }

   get priceper() {
      return this._priceper;
   }
   
   set priceper(p) {
      this._priceper = p;
   }

   get total() {
      return this._total;
   }

   set total(t) {
      this._total = t;
   }
}

//grocery list type
class GroceryList {
   _list;
   _total;
   constructor() {
      this._list = [];
      this._total = 0;
   }

   get list() {
      return this._list;
   }

   get total() {
      return this._total;
   }

   add_new(grocery) {
      this._list.push(grocery);
      this._total += grocery.total;
   }

   make_table() {
      let returnval = `<table><thead><tr><th></th><th>Item</th><th>Quantity</th><th>Price Per Item</th><th>Total</th></tr></thead>\n`;
      returnval += "<tbody>\n";

      let index = 1;

      for (let g of this._list) {
         let price = Math.round(g.priceper*100)/100
         let total = Math.round(g.total*100)/100
         returnval += `<tr><td>${index}</td><td>${g.name}</td><td>${g.quantity}</td><td>$${price}</td><td>$${total}</td></tr>\n`;
      }

      let total = Math.round(this._total*100)/100
      returnval += `<tr id="totalrow"><td>Total</td><td></td><td></td><td></td><td>$${total}</td></tr>\n`;

      returnval += "</tbody>\n";
      returnval += "</table>\n";
      
      return returnval;
   }
}

//recurring variables:
let currentlookup;
let tableresult;

//functions:


async function lookup(name) {
   try {
        await client.connect();
        const database = client.db(MONGO_DB_NAME);
        const collection = database.collection(MONGO_COLLECTION);

        let filter = {name: name};
        result = await collection.findOne(filter);
        if (result) {
            return {success: true, name: result.name, table: result.table};
        } else {
            throw new Error("grocery list not found (lookup)")
        }
   } catch (e) {
        return {success: false};
   } finally {
        client.close();
   }
}

async function savelist(name) {
   console.log("savelist");
   try {
      if (!tableresult) {
         throw new Error("tableresult null or undefined");
      }
         await client.connect();
         const database = client.db(MONGO_DB_NAME);
         const collection = database.collection(MONGO_COLLECTION);

         let filter = {name: name};
         result = await collection.findOne(filter);
         if (result) {
               throw new Error("name of groceries list already exists")
         } else {
            const list = { name: name, table: tableresult};
            let result = await collection.insertOne(list);
            if (result) {
               tableresult = null;
               return true;
            } else {
               throw new Error("MongoDB insertOne fail");
            }
        }
   } catch (e) {
        return false;
   } finally {
        client.close();
   }
}

// page renderings:

//index page
app.get("/", (request, response) => {response.render("index", {});});

//bahaha page
app.get("/bahaha", (request, response) => {response.render("bahaha", {});});

//shopping page
app.get("/shopping", (request, response) => {response.render("shopping", {});});

//shoppinglist page
app.post("/shoppinglist", (request, response) => {
   console.log("FULL BODY:", request.body);
   console.log("groceryoutput", request.body.groceryoutput);
   let json = JSON.parse(request.body.groceryoutput);
   let grocerylist = new GroceryList();
   for (item of json) {
      grocerylist.add_new(new Grocery(item.name, item.quantity, item.price));
   }
   tableresult = grocerylist.make_table(); 

   response.render("result", {result: tableresult});
});

//save form page
app.get("/save", (request, response) => {response.render("save", {});});

//save verification route
app.get("/check-name", async (request, result) => {
  const name = request.query.name;
  const res = await savelist(name);
  result.json({success: res});
});

//save success page
app.post("/savesuccess", (request, response) => {response.render("savesuccess", {name: request.body.name});});

//lookup page
app.get("/lookup", (request, response) => {response.render("lookup", {});});

//check lookup route
app.get("/check-db", async (request, response) => {
  const name = request.query.name;
  const res = await lookup(name);
  response.json(res);
});

//lookuplist page
app.post("/lookuplist", (request, response) => {response.render("lookupResult", {name: request.body.name, table: request.body.result});});

//error page
// app.get('*', function(request, response){response.render("error", {});});

app.listen(portNumber);