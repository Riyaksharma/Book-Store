const mongoose = require("mongoose");
const book = require("./book");
const Book = require("./book");

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

//cant delete an author if its book already present
authorSchema.pre("remove", function (next) {
  Book.find({ author: this.id }, (err, books) => {
    if (err) {
      next(err);
    } else if (books.length > 0) {
      next(new Error("This author has other books in directory"));
    } else {
      next();
    }
  });
});

module.exports = mongoose.model("Author", authorSchema);
