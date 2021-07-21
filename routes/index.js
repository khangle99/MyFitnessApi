var express = require('express');
const { firestore, app } = require('firebase-admin');
var router = express.Router();
var admin = require('firebase-admin');
var serviceAccount = require("../serviceAccountKey.json");
var multer = require('multer')
var upload = multer({
  dest: './public/data/uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }
})

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


router.get('/excercisesCatalog', function (req, res, next) {

  admin.firestore().collection("excercises").get().then((querySnapshot) => {
    var arr = []
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      arr.push(doc.data())
    });

    res.end(JSON.stringify(arr))
  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'something is wrong' })
    res.end()
  });


});

router.get('/excercises', function (req, res, next) {
  let id = req.query.cataId
  admin.firestore().collection("excercises").doc(id).collection("ex_list").get().then((querySnapshot) => {
    var arr = []
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      arr.push(doc.data())
    });

    res.end(JSON.stringify(arr))
  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'something is wrong' })
    res.end()
  });


});

router.post('/newCatalog', upload.single('photos'), function (req, res, next) {
  // chuan bi data
  let data = req.body

  let id = data.name.replace(/\s+/g, '').toLowerCase()
  console.log(id)
  console.log(req.file)
  if (!req.file) {
    res.status(400).send("Error: No files found")
  } else {

    console.log(req.protocol + req.hostname + req.file.path.substring(6))
    // cap nhat firestore
    admin.firestore().collection("excercises").doc(id).set({
      name: data.name,
      photoUrl: "https://" + req.hostname + req.file.path.substring(6)
    })
      .then(() => {
        console.log("Tao moi catalog thanh cong")
        res.end()
      })
      .catch((error) => {
        console.error("Loi tao moi catalog: ", error)
        res.status(500).json({ error: 'loi' })
        res.end()
      });
    res.end()
  }


});




module.exports = router;
