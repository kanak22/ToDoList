//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require('lodash');
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
const pswd = process.env.MONGODB_PASSWORD;
mongoose.connect("mongodb+srv://admin-kanak:"+pswd+"@cluster0.snifv.mongodb.net/todolistDB?retryWrites=true/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to-do list!"
});
const item2 = new Item({
  name: "click + button to add new items"
});
const item3 = new Item({
  name: "click the checkbox once completed the task"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("list", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added");
        }
      });
    }

    res.render("list", {
      listTitle: "Today",
      newListItems: items
    });

  });

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundlist) {
      foundlist.items.push(item);
      foundlist.save();
      res.redirect("/" + listName)
    })
  }
});

app.post("/delete", function(req, res) {
  const checked = req.body.checkbox;
  const listName = req.body.listName;

  console.log(listName);

  if (listName === "Today") {
    Item.findByIdAndRemove(checked, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted Successfully the checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checked
        }
      }
    }, function(err, foundlist) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/:listID", function(req, res) {
  const customListName = _.capitalize(req.params.listID);

  List.findOne({
    name: customListName
  }, function(err, foundlist) {
    if (!err) {
      if (!foundlist) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //show existing list
        res.render("list", {
          listTitle: foundlist.name,
          newListItems: foundlist.items
        });
      }
    } else {
      console.log(err);
    }
  })
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started Successfully");
});
