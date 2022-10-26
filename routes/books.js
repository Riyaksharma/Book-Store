const express = require("express");
const router = express.Router();
/*-> no more mutler for file

const multer = require("multer"); 
const path = require("path");
const uploadPath = path.join("public", Books.coverImageBasePath);
*/

const Books = require("../models/book");

const Author = require("../models/author");

const imageMimeTypes = ["image/jpeg", "image/gif", "image/png"];

/* const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  },
}); */

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
/*  Because of file pond we r getting a string not a file

router.post("/", upload.single("cover"), async (req, res) => {
const fileName = req.file != null ? req.file.filename : null;

*/

//Create Books Route
router.post("/", async (req, res) => {
  const book = new Books({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    // coverImageName: fileName,
    description: req.body.description,
  });

  saveCover(book, req.body.cover);

  try {
    const newBook = await book.save();
    res.redirect(`/books/${newBook.id}`);
  } catch {
    /* if (book.coverImageName != null) {
      removeBookCover(book.coverImageName);
    } */
    renderNewPage(res, book, true);
  }
});

//show Book
router.get("/:id", async (req, res) => {
  try {
    const book = await Books.findById(req.params.id).populate("author").exec();
    res.render("books/show", { book: book });
  } catch {
    res.redirect("/");
  }
});

//Edit Books
router.get("/:id/edit", async (req, res) => {
  try {
    const book = await Books.findById(req.params.id);
    renderEditPage(res, book);
  } catch {
    res.redirect("/");
  }
});

//Update Book
router.put("/:id", async (req, res) => {
  let book;

  try {
    book = await Books.findById(req.params.id);
    book.title = req.body.title;
    book.description = req.body.description;
    book.author = req.body.author;
    book.publishDate = new Date(req.body.publishDate);
    book.pageCount = req.body.pageCount;

    if (req.body.cover != null && req.body.cover != "") {
      saveCover(book, req.body.cover);
    }
    await book.save();
    res.redirect(`/books/${book.id}`);
  } catch {
    if (book != Null) {
      renderEditPage(res, book, true);
    } else {
      res.redirect("/");
    }
  }
});

//Delete Book
router.delete("/:id", async (req, res) => {
  let book;
  try {
    book = await Books.findById(req.params.id);
    await book.remove();
    res.redirect("/books");
  } catch {
    if (book != null) {
      res.render("books/show", {
        book: book,
        errorMessage: "Could not delete this book",
      });
    } else {
      res.redirect("/");
    }
  }
});

/* function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), (err) => {
    if (err) console.error(err);
  });
} 

*/

function saveCover(book, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, "base64");
    book.coverImageType = cover.type;
  }
}

async function renderNewPage(res, book, hasError = false) {
  renderFormPage(res, book, "new", hasError);
  /* try {
    const authors = await Author.find({}); // find all authors
    const params = {
      authors: authors,
      book: book,
    };
    if (hasError) params.errorMessage = "Error occured";
    res.render("books/new", params);
  } catch {
    res.redirect("/books");
  } */
}

async function renderEditPage(res, book, hasError = false) {
  renderFormPage(res, book, "edit", hasError);

  /* try {
    const authors = await Author.find({}); // find all authors
    const params = {
      authors: authors,
      book: book,
    };
    if (hasError) params.errorMessage = "Error occured";
    res.render("books/edit", params);
  } catch {
    res.redirect("/books");
  } */
}

async function renderFormPage(res, book, form, hasError = false) {
  try {
    const authors = await Author.find({}); // find all authors
    const params = {
      authors: authors,
      book: book,
    };
    if (hasError) {
      if (form == "edit") {
        params.errorMessage = "Error in Updating book";
      } else {
        params.errorMessage = "Error in creating book";
      }
    }
    res.render(`books/${form}`, params);
  } catch {
    res.redirect("/books");
  }
}
module.exports = router;
