// Dependencies

  var express = require("express");
  var exphbs  = require('express-handlebars');
  var mongojs = require("mongojs");
  var bodyParser = require('body-parser')
  var logger = require("morgan");
  const mongoose = require('mongoose');
  // Require request and cheerio. This makes the scraping possible
  var request = require("request");
  var cheerio = require("cheerio");


// App setup

  // Initialize Express
  var app = express();

  // Setting up handlebars view engine.
  app.engine('handlebars', exphbs({defaultLayout: 'main'}));
  app.set('view engine', 'handlebars');

  // Use morgan logger for logging requests
  app.use(logger("dev"));
  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }));
  // parse application/json
  app.use(bodyParser.json());

  // Database configuration 
  var databaseUrl = "scraper";
  var collections = ["scrapedData"];

  // Hook mongojs configuration to the db variable
  var db = mongojs(databaseUrl, collections);
  db.on("error", function(error) {
    console.log("Database Error:", error);
  });

  // defining a connection using mongoose
    // If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
    var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
     
    // Set mongoose to leverage built in JavaScript ES6 Promises
    // Connect to the Mongo DB
    mongoose.Promise = Promise;
    mongoose.connect(MONGODB_URI);


// Main route (simple Hello World Message)
app.get("/", function(req, res) {
  res.send("Hello world");  // [] This will be replaced by the main page for the app.
});

// Retrieve data from the db
app.get("/all", function(req, res) {
  // Find all results from the collection in the db
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
  // Make a request for web developers on craigslist
  request("https://austin.craigslist.org/search/jjj?query=web+developer&sort=rel", function(error, response, html) {

    // Load the html body from request into cheerio
    var $ = cheerio.load(html);

    // For each element with a "title" class
    $(".result-row").each(function(i, element) { // [] This data isn't being scraped currently. I need to figure this out. Maybe go back to the first homework today where scraping is demonstrated. to see if I have the elements right.
      // Save the text and href of each link enclosed in the current element
      var title = $(element).find("p > a").text();
      var link = $(element).find("p > a").attr("href");

      // If this found element had both a title and a link
      if (title && link) {
        // Insert the data in the scrapedData db
        db.scrapedData.insert({
          title: title,
          link: link
        },
        function(err, inserted) {
          if (err) {
            // Log the error if one is encountered during the query
            console.log(err);
          }
          else {
            // Otherwise, log the inserted data
            console.log(inserted);
          }
        });
      }
    });
  });

  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});


// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000.");
});
