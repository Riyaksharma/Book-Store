const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const Books = require("../models/book");
const uploadPath = path.join("public", Books.coverImageBasePath);
const Author = require("../models/author");

const imageMimeTypes = ["image/jpeg", "image/gif", "image/png"];
const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  },
});

//All Books routers
router.get("/", async (req, res) => {
  let query = Books.find();

  //For searching book name
  if (req.query.title != null && req.query.title != "") {
    query = query.regex("title", new RegExp(req.query.title, "i"));
  }

  //For search by date
  if (req.query.publishBefore != null && req.query.publishBefore != "") {
    query = query.lte("publishDate", req.query.publishBefore);
  }
  if (req.query.publishAfter != null && req.query.publishAfter != "") {
    query = query.gte("publishDate", req.query.publishAfter);
  }

  try {
    const books = await query.exec();
    // const books = await Books.find({});
    res.render("books/index", {
      books: books,
      searchOptions: req.query,
    });
  } catch {
    res.redirect("/");
  }
});

//New Books
router.get("/new", async (req, res) => {
  renderNewPage(res, new Books());
});

//Create Books Route
router.post("/", upload.single("cover"), async (req, res) => {
  const fileName = req.file != null ? req.file.filename : null;
  const book = new Books({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    coverImageName: fileName,
    description: req.body.description,
  });
  try {
    const newBook = await book.save();
    res.redirect(`books`);
  } catch {
    if (book.coverImageName != null) {
      removeBookCover(book.coverImageName);
    }
    renderNewPage(res, book, true);
  }
});

function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), (err) => {
    if (err) console.error(err);
  });
}

async function renderNewPage(res, book, hasError = false) {
  try {
    const authors = await Author.find({}); // find all authors
    const params = {
      authors: authors,
      book: book,
    };
    if (hasError) params.errorMessage = "Error occured";
    res.render("books/new", params);
  } catch {
    res.redirect("/books");
  }
}

module.exports = router;
