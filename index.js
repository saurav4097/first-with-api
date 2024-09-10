const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(express.json()); // For parsing JSON data

// Set the view engine to EJS
app.set("view engine", "ejs");

// Serve static files from the 'public' folder
app.use(express.static("public"));

// MongoDB setup
const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017';
const databaseName = 'e-commerse';
const client = new MongoClient(url);

let collection; // Variable to store the MongoDB collection

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        const db = client.db(databaseName);
        collection = db.collection('products');
    } catch (err) {
        console.error('Error connecting to MongoDB', err);
    }
}

// Middleware to parse request body
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// Home route
app.get("/", async (req, res) => {
    try {
        const data = await collection.find({}).toArray();
        res.render("index", { data: data });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Error fetching data');
    }
});

// ADD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/add", (req, res) => {
    res.render("add");
});

// Route to handle form submission and insert data
app.post('/aaded', async (req, res) => {
    const { name, price } = req.body; // Use req.body for POST data

    try {
        const newData = {
            name: name,
            price: parseFloat(price) // Ensure price is a number
        };

        // Insert the new document into the collection
        const result = await collection.insertOne(newData);

        // Redirect to the home page after adding
        res.redirect("/");
    } catch (err) {
        console.error('Error inserting document:', err);
        res.status(500).send('Error inserting document');
    }
});

//////SEARCH///////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/search", (req, res) => {
    res.render("search", { data: [] });  // Initially render with an empty data array
});

// POST route to capture the search term and redirect to the results page
app.post('/search1', (req, res) => {
    const searchName = req.body.name;  // Capture the search term from the form submission
    res.redirect(`/search-results?name=${encodeURIComponent(searchName)}`);  // Redirect with query parameter
});

// GET route to display the search results
app.get('/search-results', async (req, res) => {
    const name = req.query.name || '';  // Get the search term from the query string
    try {
        const data = await collection.find({
            name: { $regex: name, $options: 'i' }  // Case-insensitive regex search
        }).toArray();
        
        res.render('search', { data: data });  // Pass the search results to the template
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Error fetching data');
    }
});

//////DELET////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/delete", async (req, res) => {
    const topicToDelete = req.body.topic;
    try {
        const deleteResult = await collection.deleteOne({ name: topicToDelete });

        // Check if something was deleted
        
            const data = await collection.find({}).toArray();
            res.render('index', { data: data, deleted: topicToDelete });
        
    } catch (err) {
        console.error('Error deleting data:', err);
        res.status(500).send('Error deleting data');
    }
});



// Start the server after connecting to MongoDB
connectToMongoDB().then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Failed to start the server due to MongoDB connection error', err);
});
