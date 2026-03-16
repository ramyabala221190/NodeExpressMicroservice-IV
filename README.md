# Interfaces, MongoDB Schema and API responses structure

From my experience, we require 3 seperate interfaces types:
1. An interface that models the Mongodb collection schema
2. Single or multiple interfaces that model the API responses.
3. Single or multiple interfaces that model incoming payload of the API.

We have moved the interfaces corresponding 2. and 3. to a seperate TS package:api-contracts, so that it can be shared amongst the microservices.
The TS package will be a single point of change in the interfaces. Its a github package. More details on this package is available
in the repo itself

The mongodb schema and the interface in 1. will be maintained in the respective microservice.

We never pass the mongoose functions or details in the API response or payload i.e we never use mongoose types in the interfaces in 2. and 3.
It is essential that the interfaces in 2. and 3. only using "string" as the type for fields that store ObjectId.
Date remains Date in mongoose or JS. So no change.
To help with this conversion, we have written a mapper.ts to convert the ProductDocument(which contains all mongoose details) into
ProductModel, which is a plain JS object.

```
export function schemaToResponseMapper(product: ProductDocument): ProductModel {
    const productObj=product.toObject();
    return {
        ...productObj,
        ...{
            _id: productObj._id.toString(),
            ...{
                reviews: productObj.reviews.map((x:ReviewDocument) => {
                    return {
                        ...x,
                        ...{ _id: x._id.toString() }
                    }
                })
            }
        }
    }
}

```

Our first step in the conversion is to use The `toObject()` method, to convert a Mongoose document instance into a plain JavaScript object (POJO)
`const productObj=product.toObject();`
Next, we have used that object: productObj to convert all ObjectId fields into string fields using the `toString()`.

Note that the same string fields in the incoming API payload, can be converted into ObjectID using `new mongoose.Types.ObjectId(fieldName)`;
This is required when you need to query these fields. Below is an example.
```
 const productObjectIds= productIds.map(x=>new mongoose.Types.ObjectId(x)); //convert string into ObjectId
const products: ProductDocument[] = await productModel.find({ _id: { $in: productObjectIds } } //find always returns array of docs or []
```

Another important point is related to optional and required fields in the schema vs interface.

In the schema `title: { type: String, required: true }` means the title field is also mandatory in the interface `title:string`. It cannot
be `title?:string`.
If using `{timestamps:true}` in schema, ensure the additonal fields: `createdAt` and `updatedAt` are also included in the interfaces.
`_id` is not included in the schema. It is added by default in the main document and sub documents.
You need to explicitly add it in the interface if required or map it to some other field name in the interface(eg: ID) or omit it if not required.


# Integrating with Swagger UI and Open API for API documentation

We have added the openapi documentations for each microservice in the api-contracts github package.
We are installing the package in each microservice. Since its a github package, authentication is required when installing it.

Thus we have added a .npmrc file in the root of the project. ramyabala221190 is the username. ${GITHUB_PAT} will be replaced with your
github personal access token, save the file and then do the installation of the api-contracts package from github.
```
@ramyabala221190:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${GITHUB_PAT}

For installation of the local .tgz file, this PAT is not required. Its only needed when installing from github.

```
In order to load the swagger UI dashboard when the microservice is up and running, we are installing `swagger-ui-express` npm package as a dependency.  We are also installing swagger-cli as dev dep to enable bundling in case we are referencing schemas or anything else from other
.json files
```
npm i --save-dev @types/swagger-ui-express
npm i --save swagger-ui-express
npm i --save-dev swagger-cli
```

So when we start the microservice using `npm run local`, the below pre script will also execute automatically

`"prelocal": "swagger-cli bundle node_modules/@ramyabala221190/api-contracts/dist/openapi/order/openapi.json -o bundled-order.json -t json"`

So we are picking the correct openapi.json file from the node_modules for the current microservice, bundling it into a bundled-user.json
file in the root of the project. We will be using this file in the app.ts.

Finally in the app.ts, we add the below lines of code to integrate the openapi.json with the swagger ui
dashboard. /api-docs is the route we need to hit, to access the Swagger UI dashboard. So we hit localhost:3604/api-docs to access the dashboard.

```
if (process.env.APP_ENV !== "prod") {
  //we dont swagger in prod
  const orderJSONPath=join(`${process.cwd()}`,'bundled-order.json');
  const orderJSON= readFileSync(orderJSONPath,{encoding:'utf8'});
  app.use(
    '/api-docs',
    swaggerUI.serve,
    swaggerUI.setup(JSON.parse(orderJSON), { explorer: true, swaggerOptions: {
    supportedSubmitMethods: ['get'] // Disables the "Execute" button for POST, PUT, DELETE
  } })
  )
}

```
# Schema Validators

Here’s the **full list of built-in validators in Mongoose** you can use in your schema definitions:

---

## 🔑 Default Validators
- **`required`** → Ensures the field is present.  
- **Type casting** → Automatically checks that values can be cast to the defined type (`String`, `Number`, `Date`, etc.).  

---

## 📋 Built-in Validators
| Validator | Applies To | Description |
|-----------|------------|-------------|
| `required` | All types | Field must be present. |
| `min` | Number, Date | Minimum value allowed. |
| `max` | Number, Date | Maximum value allowed. |
| `enum` | String | Value must be one of a predefined set. |
| `match` | String | Value must match a regex pattern. |
| `minLength` | String | Minimum length of string. |
| `maxLength` | String | Maximum length of string. |
| `validate` | Any type | Custom validator function. |
| `unique` | Any type | Creates a unique index in MongoDB (not a true validator, but enforces uniqueness at DB level). |

---

## 📌 Example
```js
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  age: { type: Number, min: 18, max: 65 },
  email: { type: String, match: /.+\@.+\..+/ },
  role: { type: String, enum: ['admin', 'user', 'guest'] },
  bio: { type: String, minLength: 10, maxLength: 200 }
});
```

---

✅ **Summary:**  
- **Always applied by default** → `required` and type casting.  
- **Optional extras you can add** → `min`, `max`, `enum`, `match`, `minLength`, `maxLength`, `validate`, `unique`.  

# Getting data into the collection

## 📊 Data Insertion Methods with Example Operators

| Method | Ease of Use | Performance | Best Use Case | Example Operators / Commands |
|--------|-------------|-------------|---------------|-------------------------------|
| **Mongoose (Node.js ORM)** | High | Moderate | Web apps, APIs needing schema validation & middleware | `new User({...}).save()` or `User.create({...})` |
| **MongoDB Driver (Native)** | Moderate | High | High-performance apps, microservices | `db.collection('users').insertOne({...})` or `insertMany([...])` |
| **`mongosh` (Mongo Shell)** | High | Low | Quick testing, debugging, admin tasks | `db.users.insertOne({...})`, `db.users.insertMany([...])` |
| **`mongoimport` CLI** | Moderate | High | Bulk import, migrations | `mongoimport --db=test --collection=users --file=users.json --jsonArray` |
| **MongoDB Compass / Atlas UI** | Very High | Low | Manual edits, demos, non-technical users | GUI “Insert Document” button (no operator, point-and-click) |
| **REST / GraphQL APIs** | Moderate | Moderate | Production apps where clients submit data | `POST /api/users` → backend calls `insertOne({...})` |
| **Bulk Operations (`insertMany`, `bulkWrite`)** | Moderate | Very High | Large-scale inserts, ETL workloads | `db.users.insertMany([...])`, `db.users.bulkWrite([{ insertOne: {...} }, ...])` |
| **ETL / Data Pipelines (Kafka, Spark, Airflow)** | Low | Very High | Enterprise integration, real-time ingestion | Operators vary: Spark → `.write.format("mongo").save()`, Kafka → MongoDB Sink Connector |

---

### ✅ Key Takeaways
- **Operators in code**: `insertOne`, `insertMany`, `bulkWrite` are the core MongoDB operators across most methods.  
- **Mongoose adds abstraction**: `save()`, `create()` wrap those operators with schema validation.  
- **CLI tools**: `mongoimport` uses flags instead of operators.  
- **GUI tools**: Compass/Atlas UI are operator-free, but internally they still call `insertOne`.  
- **ETL pipelines**: Use connectors or libraries that eventually call the same insert operators under the hood.  

mongoimport --file "C:\Users\User\Desktop\users.json" --db myUsers --collection users --drop --jsonArray

```
PS C:\Users\User\angular\mongodb> mongoimport --file "C:\Users\User\Desktop\users.json" --db myUsers --collection users --drop --jsonArray
2026-01-19T17:37:23.2o42+0530    connected to: mongodb://localhost/
2026-01-19T17:37:23.244+0530    dropping: myUsers.users
2026-01-19T17:37:23.271+0530    30 document(s) imported successfully. 0 document(s) failed to import.
PS C:\Users\User\angular\mongodb> show dbs

```
mongoimport will respect schema if you have created a collection with validators. 
```
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "age"],
      properties: {
        name: { bsonType: "string" },
        age: { bsonType: "int", minimum: 18 }
      }
    }
  }
});

```

In each microservice, we have added the data into collection via the mongoose create()
which automatically does the schema validation. Check dbConnectionService.ts

# Referencing vs Embedding documents from other collections

In MongoDB, you can model relationships between documents using **embedding** or **referencing**, and the choice depends on your application's access patterns, scalability needs, and data complexity. Here’s a clear comparison:

## 📊 Embedding vs Referencing in MongoDB

| Aspect | Embedding | Referencing |
|--------|-----------|-------------|
| **Definition** | Store related data inside a single document (nested structure). | Store related data in separate collections and link them via ObjectIDs or keys. |
| **Performance** | Faster reads since all related data is fetched in one query. | Slower reads, often requiring multiple queries or `$lookup` joins. |
| **Atomicity** | Updates to the document are atomic (all-or-nothing). | Atomicity limited to individual documents; cross-document transactions may be needed. |
| **Data Size** | Best for small, bounded subdocuments. | Better for large, growing, or frequently changing related data. |
| **Flexibility** | Less flexible if relationships change often. | More flexible for complex, many-to-many, or shared relationships. |
| **Use Cases** | User profile with embedded addresses, product with embedded reviews. | Orders referencing customers, blog posts referencing authors, carts referencing products. |
| **Schema Complexity** | Simpler queries, but risk of bloated documents. | More normalized, but queries can be more complex. |

## ✅ When to Use Each
- **Embedding is ideal when:**
  - Data is tightly coupled and always accessed together.
  - The relationship is one-to-few (e.g., a user with a few addresses).
  - You want fast reads and atomic updates.

- **Referencing is ideal when:**
  - Data is loosely coupled or shared across multiple documents.
  - The relationship is one-to-many or many-to-many (e.g., products in multiple carts).
  - You need scalability and avoid document size limits (16 MB in MongoDB).

## ⚖️ Trade-Offs
- Embedding favors **denormalization** (speed, simplicity) but risks duplication and large documents.
- Referencing favors **normalization** (flexibility, scalability) but requires joins or multiple queries.

- **Embed** when data is small, tightly coupled, and immutable (like flash‑sale products, shipping addresses, or order line items).
- **Reference** when data is large, reused, or frequently updated (like users, catalog products, or inventory).

In the cart microservice, we are using the referencing approach over embedding.
The products in the cart are referenced in the carts collection using ObjectIDs. 


## ✅ Scenario Where Embedding Is Correct

Imagine you’re building a **flash‑sale app** where:

- Products are **ephemeral** (only available for a few hours).
- Product details (name, price, discount) **never change once published**.
- The cart is **short‑lived** (users either check out quickly or the cart expires).
- You don’t need to maintain historical consistency across multiple carts.

### Example Schema (Embedded)

```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),   // reference to Users collection
  "items": [
    {
      "product": {
        "name": "Wireless Mouse",
        "sku": "WM123",
        "price": 19.99,
        "discount": 0.10
      },
      "quantity": 2
    },
    {
      "product": {
        "name": "Mechanical Keyboard",
        "sku": "MK456",
        "price": 79.99,
        "discount": 0.20
      },
      "quantity": 1
    }
  ],
  "createdAt": ISODate("..."),
  "expiresAt": ISODate("...")
}
```

---

## 🔎 Why Embedding Works Here
- **No duplication concerns**: Products are short‑lived, so embedding avoids the overhead of maintaining a separate product collection.
- **Fast reads**: You can fetch the cart with all product details in one query — ideal for checkout flows.
- **Immutable product data**: Since flash‑sale products don’t change, embedding avoids the stale‑data problem.
- **Simpler design**: No need for `$lookup` or joins; the cart is self‑contained.

If using references method, 
Inside one monolith: populate() and ref works because all models are registered in the same Mongoose connection.
Inside microservices: you cannot populate() across services. You must call the other service’s API to enrich your cart response.

Each microservice maintains its own DB and hence its own mongoose schema.

Its possible that when you are sending the response back to client, you need data from multiple
DB's(and hence multiple collections). Since we have microsvcs, each microsvcs manages its own DB and 
collections.
Thus API is the only way for 1 microsvcs to fetch data from the DB of another microservice.
If cart microservice requires the details of the products stored in the cart, it will send a request
to the gateway microservice, which in turn connects to the product microservice, gets the data and
returns it back to the cart microservice.

# Transactions

We have used transactions when checking out the cart. We required 2 updates: creating an order in the orders collection and also
emptying the cart for the user in the carts collection. Either both should succeed or both should fail. In order to ensure this, transactions are required.

In MongoDB, transactions are needed when you want to guarantee ACID properties (Atomicity, Consistency, Isolation, Durability) across multiple documents, collections, or even databases. 

By default, MongoDB operations on a single document are atomic, so you don’t need transactions for most embedded-document use cases. But when relationships are modeled with referencing, or when multiple documents must be updated together, transactions become important.


### 🔑 When Transactions Are Needed
- **Multi-document updates**  
  Example: Updating both an `orders` document and a `products` document to reflect a purchase.
- **Cross-collection consistency**  
  Example: Creating an order in the `orders` collection while simultaneously decrementing stock in the `inventory` collection.
- **Many-to-many relationships**  
  Example: A student enrolling in multiple courses, requiring updates in both `students` and `courses` collections.
- **Financial or critical workflows**  
  Example: Banking transfers, checkout flows, or any process where partial updates could cause data corruption.
- **Sharded clusters**  
  Transactions can span multiple shards, ensuring consistency across distributed data.

### 🚫 When Transactions Are Not Needed
- **Single-document operations**  
  MongoDB guarantees atomicity at the document level, including updates to embedded arrays and subdocuments.
- **Bounded, embedded data**  
  If you embed related data (like a user’s addresses inside the user document), you can rely on single-document atomicity instead of transactions.
- **Eventual consistency is acceptable**  
  In scenarios where slight delays or retries are tolerable, transactions may be overkill.

### ⚖️ Trade-Offs
- Transactions add **performance overhead** compared to single-document operations.
- They are powerful but should be reserved for cases where **data integrity across multiple documents is critical**.
- Embedding often reduces the need for transactions, while referencing increases the likelihood you’ll need them.


### 🛒 Case 1: Embedding (No Transactions Needed)
Suppose you embed products directly inside the cart document:

```json
{
  "_id": "cart123",
  "userId": "user456",
  "items": [
    { "productId": "p1", "name": "Laptop", "price": 1200, "qty": 1 },
    { "productId": "p2", "name": "Mouse", "price": 25, "qty": 2 }
  ]
}
```

- **Checkout flow:**  
  - You atomically update the cart document to clear items.  
  - You atomically create an order document with the embedded items.  
- **Why no transaction?**  
  Each operation is a single-document write, and MongoDB guarantees atomicity at the document level. No cross-document consistency issues.

---

### 📦 Case 2: Referencing (Transactions Needed)
Now imagine you reference products instead of embedding:

```json
{
  "_id": "cart123",
  "userId": "user456",
  "items": [
    { "productId": "p1", "qty": 1 },
    { "productId": "p2", "qty": 2 }
  ]
}
```

Products live in a separate `products` collection:

```json
{ "_id": "p1", "name": "Laptop", "price": 1200, "stock": 10 }
{ "_id": "p2", "name": "Mouse", "price": 25, "stock": 50 }
```

- **Checkout flow:**  
  - Create an order document in `orders`.  
  - Decrement stock in `products`.  
  - Clear items in `cart`.  
- **Why transactions?**  
  These are **three separate documents across two collections**. Without a transaction, you risk partial updates (e.g., stock decremented but order not created). A multi-document transaction ensures all-or-nothing consistency.

---

### ⚖️ Summary
- **Embedding** → simpler, atomic by default, no transactions needed.  
- **Referencing** → flexible, scalable, but requires transactions for workflows that span multiple documents/collections.  

