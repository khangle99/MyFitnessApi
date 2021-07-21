var express = require('express');
const { firestore, app } = require('firebase-admin');
var router = express.Router();
var admin = require('firebase-admin');
var path = require('path');
var serviceAccount = require("../serviceAccountKey.json");
var multer = require('multer')
const fs = require('fs')
var upload = multer({
  dest: './public/data/uploads/',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      return callback(new Error('Only images are allowed'))
    }
    callback(null, true)
  }
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

router.get('/excercisesCatalogDetail', function (req, res, next) {
  let id = req.query.catalogId
  admin.firestore().collection("excercises").doc(id).get().then((doc) => {
    console.log(doc.id, " => ", doc.data());
    res.end(JSON.stringify(doc.data()))
  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'something is wrong' })
    res.end()
  });
});

router.post('/newCatalog', upload.single('photo'), function (req, res, next) {
  // chuan bi data
  let data = req.body

  let id = data.name.replace(/\s+/g, '').toLowerCase()
  console.log(id)
  console.log(req.file)
  if (!req.file) {
    res.status(400).send("Error: No files found")
  } else {
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

router.put('/updateCatalog', upload.single('photo'), function (req, res, next) {


  // chuan bi data
  let data = req.body

  if (!req.file) {
    res.status(400).send("Error: No files found")
  } else {

    // cap nhat firestore
    let catalogRef = admin.firestore().collection("excercises").doc(data.id)

    catalogRef.get().then((doc) => {
      if (!doc.exists) {
        console.log('No such document!');
        res.status(400).send("Error: No Catalog")
      } else {
        console.log('Document data:', doc.data());
        var photoUrl = doc.data().photoUrl
        let oldPhotoPath = './public/data/uploads/' + photoUrl.substring(photoUrl.indexOf("uploads/") + 8)
        try {
          fs.unlinkSync(oldPhotoPath)
          //file removed
          catalogRef.update({
            name: data.name,
            photoUrl: "https://" + req.hostname + req.file.path.substring(6)
          })
          res.end()
        } catch (err) {
          console.error(err)
          res.status(500).json({ error: 'loi cap nhat firestore' })
          res.end()
        }
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
      res.status(500).json({ error: 'loi khong doc duoc firestore' })
      res.end()
    });
  }
});


router.delete('/deleteCatalog', function (req, res, next) {
  let id = req.query.id
  // kiem tra ton tai
  let catalogRef = admin.firestore().collection("excercises").doc(id)
  catalogRef.get().then((doc) => {
    if (!doc.exists) {
      res.status(400).send("Error: No Catalog")
    } else {
      catalogRef.delete().then(() => {
        try {
          var photoUrl = doc.data().photoUrl
          let oldPhotoPath = './public/data/uploads/' + photoUrl.substring(photoUrl.indexOf("uploads/") + 8)
          fs.unlinkSync(oldPhotoPath)
          res.end()
        } catch (err) {
          res.status(500).json({ error: 'loi unlink' })
          res.end()
        }
      }).catch((error) => {
        res.status(500).json({ error: 'loi xoa catalog firestore' })
        res.end()
      });

    }
  }).catch((error) => {
    res.status(500).json({ error: 'loi khong doc duoc firestore' })
    res.end()
  });

});


/////////////// ex_list
router.get('/excercises', function (req, res, next) {
  let data = req.query
  admin.firestore().collection("excercises").doc(data.catalogId).collection("ex_list").get().then((querySnapshot) => {
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

router.get('/excercisesDetail', function (req, res, next) {
  let data = req.query
  admin.firestore().collection("excercises").doc(data.catalogId).collection("ex_list").doc(data.id).get().then((doc) => {
    console.log(doc.id, " => ", doc.data());
    res.end(JSON.stringify(doc.data()))
  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'something is wrong' })
    res.end()
  });
});


router.post('/newExcercise', upload.array('picSteps'), function (req, res, next) {
  // chuan bi data
  let data = req.body
  let id = data.name.replace(/\s+/g, '').toLowerCase()
  console.log(id)
  var imgUrls = []
  req.files.forEach(img => imgUrls.push("https://" + req.hostname + img.path.substring(6)))
  if (!req.files) {
    res.status(400).send("Error: No files found")
  } else {
    admin.firestore().collection("excercises").doc(data.catalogId).collection("ex_list").doc(id).set({
      name: data.name,
      picSteps: imgUrls,
      difficulty: data.difficulty,
      tutorial: data.tutorial,
      equipment: data.equipment
    })
      .then(() => {
        res.end()
      })
      .catch((error) => {
        console.error("Loi tao moi excercise: ", error)
        res.status(500).json({ error: 'loi tao excercise' })
        res.end()
      });
    res.end()
  }

});

router.post('/updateExcercise', upload.array('picSteps'), function (req, res, next) {
  // chuan bi data
  let data = req.body
  let id = data.id
  var imgUrls = []
  req.files.forEach(img => imgUrls.push("https://" + req.hostname + img.path.substring(6)))
  console.log(imgUrls)
  if (!req.files) {
    res.status(400).send("Error: No files found")
  } else {

    // cap nhat firestore
    let excerciseRef = admin.firestore().collection("excercises").doc(data.catalogId).collection("ex_list").doc(id)

    excerciseRef.get().then((doc) => {
      if (!doc.exists) {
        console.log('No such document!---------');
        res.status(400).send("Error: No Excercise")
      } else {
        var oldPhotoPaths = []
        var photoUrls = doc.data().picSteps
        photoUrls.forEach(url => oldPhotoPaths.push('./public/data/uploads/' + url.substring(url.indexOf("uploads/") + 8)))
        console.log(oldPhotoPaths)
        try {
          excerciseRef.update({
            name: data.name,
            picSteps: imgUrls,
            difficulty: data.difficulty,
            tutorial: data.tutorial,
            equipment: data.equipment
          }) // chua lam then

          oldPhotoPaths.forEach(ptPath => fs.unlinkSync(ptPath))
          //file removed

          res.end()
        } catch (err) {
          console.error(err)
          res.status(500).json({ error: 'loi cap nhat firestore' })
          res.end()
        }
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
      res.status(500).json({ error: 'loi khong doc duoc firestore' })
      res.end()
    });

  }

});


router.delete('/deleteExcercise', function (req, res, next) {
  let id = req.query.id
  let catId = req.query.catalogId
  // kiem tra ton tai
  let excerciseRef = admin.firestore().collection("excercises").doc(catId).collection("ex_list").doc(id)
  excerciseRef.get().then((doc) => {
    if (!doc.exists) {
      res.status(400).send("Error: No Excercise")
    } else {

      try {

        excerciseRef.delete().then(() => {
          try {
            var oldPhotoPaths = []
            var photoUrls = doc.data().picSteps
            photoUrls.forEach(url => oldPhotoPaths.push('./public/data/uploads/' + url.substring(url.indexOf("uploads/") + 8)))
            oldPhotoPaths.forEach(ptPath => fs.unlinkSync(ptPath))
            res.end()
          } catch (err) {
            res.status(500).json({ error: 'loi unlink' })
            res.end()
          }
          res.end()
        }).catch((error) => {
          res.status(500).json({ error: 'loi xoa catalog' })
          res.end()
        });
      } catch (err) {
        res.status(500).json({ error: 'loi unlink' })
        res.end()
      }

    }
  }).catch((error) => {
    res.status(500).json({ error: 'loi khong doc duoc firestore' })
    res.end()
  });

});


module.exports = router;


