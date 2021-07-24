var express = require('express');
const { firestore, app } = require('firebase-admin');
var router = express.Router();
var admin = require('firebase-admin');
var path = require('path');
var serviceAccount = require("../serviceAccountKey.json");
var multer = require('multer')
const fs = require('fs');
const { timeStamp } = require('console');
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// catalog
router.get('/excercisesCatalog', function (req, res, next) {

  admin.firestore().collection("excercises").get().then((querySnapshot) => {
    var arr = []
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      var ob = doc.data()
      ob.id = doc.id
      arr.push(ob)
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
    if (!doc.exists) {
      res.status(500).json({ error: 'Khong ton tai id nay' })
      res.end()
    } else {
      console.log(doc.id, " => ", doc.data());
      res.end(JSON.stringify(doc.data()))
    }

  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'loi firestore' })
    res.end()
  });
});

router.post('/newCatalog', upload.single('photo'), function (req, res, next) {
  // chuan bi data
  let data = req.body
  if (!req.file) {
    res.status(500).json({ error: 'Khong co file' })
    res.end()
  } else {
    let catalogsRef = admin.firestore().collection("excercises")
    catalogsRef.add({
      name: data.name,
      photoUrl: "https://" + req.hostname + req.file.path.substring(6)
    })
      .then((cataRef) => {
        console.log("Tao moi catalog thanh cong")
        res.end(JSON.stringify({ id: cataRef.id }))
      })
      .catch((error) => {
        console.error("Loi tao moi catalog: ", error)
        fs.unlinkSync("./" + req.file.path)
        res.status(500).json({ error: 'loi' })
        res.end()
      });

  }

});

router.put('/updateCatalog', upload.single('photo'), function (req, res, next) {
  // chuan bi data
  let data = req.body
  if (!req.file) {
    fs.unlinkSync("./" + req.file.path)
    res.status(400).send("Error: No files found")
  } else {
    // cap nhat firestore
    let catalogRef = admin.firestore().collection("excercises").doc(data.id)
    catalogRef.get().then((doc) => {
      if (!doc.exists) {
        console.log('No such document!');
        fs.unlinkSync("./" + req.file.path)
        res.status(400).send("Error: No Catalog")
      } else {
        console.log('Document data:', doc.data());
        var photoUrl = doc.data().photoUrl
        let oldPhotoPath = './public/data/uploads/' + photoUrl.substring(photoUrl.indexOf("uploads/") + 8)
        try {

          //file removed
          catalogRef.update({
            name: data.name,
            photoUrl: "https://" + req.hostname + req.file.path.substring(6)
          }).then(() => {
            try {
              fs.unlinkSync(oldPhotoPath)
              res.end(JSON.stringify({ id: data.id }))
            } catch (error) {
              fs.unlinkSync("./" + req.file.path)
              res.status(500).json({ error: 'loi unlink' })
              res.end()
            }

          }).catch((error) => {
            fs.unlinkSync("./" + req.file.path)
            res.status(500).json({ error: 'loi cap nhat firestore' })
            res.end()
          })

        } catch (err) {
          console.error(err)
          fs.unlinkSync("./" + req.file.path)
          res.status(500).json({ error: 'loi cap nhat firestore' })
          res.end()
        }
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
      fs.unlinkSync("./" + req.file.path)
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
          res.end(JSON.stringify({ id: id }))
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// ex_list
router.get('/excercises', function (req, res, next) {
  let data = req.query
  admin.firestore().collection("excercises").doc(data.catalogId).collection("ex_list").get().then((querySnapshot) => {
    var arr = []
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      var ob = doc.data()
      ob.id = doc.id
      arr.push(ob)
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
    if (!doc.exists) {
      res.end(JSON.stringify({ error: "khong ton tai id" }))
    } else {
      console.log(doc.id, " => ", doc.data());
      res.end(JSON.stringify(doc.data()))
    }

  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'something is wrong' })
    res.end()
  });
});


router.post('/newExcercise', upload.array('picSteps'), function (req, res, next) {
  // chuan bi data
  let data = req.body
  if (!req.files) {
    res.status(400).send("Error: No files found")
  } else {
    var imgUrls = []
    req.files.forEach(img => imgUrls.push("https://" + req.hostname + img.path.substring(6)))
    let excercisesRef = admin.firestore().collection("excercises").doc(data.catalogId).collection("ex_list")
    excercisesRef.add({
      name: data.name,
      picSteps: imgUrls,
      difficulty: data.difficulty,
      tutorial: data.tutorial,
      equipment: data.equipment
    })
      .then((excRef) => {
        res.end(JSON.stringify({ id: excRef.id }))
      })
      .catch((error) => {
        console.error("Loi tao moi excercise: ", error)
        req.files.forEach(item => {
          fs.unlinkSync("./" + item.path)
        })
        res.status(500).json({ error: 'loi tao excercise' })
        res.end()
      });

  }

});

router.put('/updateExcercise', upload.array('picSteps'), function (req, res, next) {
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
        req.files.forEach(item => {
          fs.unlinkSync("./" + item.path)
        })
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

          res.end(JSON.stringify({ id: data.id }))
        } catch (err) {
          console.error(err)
          req.files.forEach(item => {
            fs.unlinkSync("./" + item.path)
          })
          res.status(500).json({ error: 'loi cap nhat firestore' })
          res.end()
        }
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
      req.files.forEach(item => {
        fs.unlinkSync("./" + item.path)
      })
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
            res.end(JSON.stringify({ id: id }))
          } catch (err) {
            res.status(500).json({ error: 'loi unlink' })
            res.end()
          }
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// nutrition
router.get('/nutritionCategory', function (req, res, next) {
  admin.firestore().collection("nutrition").get().then((querySnapshot) => {
    var arr = []
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      var ob = doc.data()
      ob.id = doc.id
      arr.push(ob)
    });

    res.end(JSON.stringify(arr))

  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'something is wrong' })
    res.end()
  });
});

router.get('/nutritionCatalogDetail', function (req, res, next) {
  let id = req.query.catalogId
  admin.firestore().collection("nutrition").doc(id).get().then((doc) => {
    if (!doc.exists) {
      res.status(500).json({ error: 'Khong ton tai nutrition id nay' })
      res.end()
    } else {
      console.log(doc.id, " => ", doc.data());
      res.end(JSON.stringify(doc.data()))
    }
  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'loi firestore' })
    res.end()
  });
});

router.post('/newNutritionCatalog', upload.single('photo'), function (req, res, next) {
  // chuan bi data
  let data = req.body
  if (!req.file) {
    res.status(500).json({ error: 'Khong co file' })
    res.end()
  } else {
    admin.firestore().collection("nutrition").add({
      name: data.name,
      photoUrl: "https://" + req.hostname + req.file.path.substring(6)
    })
      .then((nutriRef) => {
        console.log("Tao moi nutrition catalog thanh cong")
        res.end(JSON.stringify({ id: nutriRef.id }))
      })
      .catch((error) => {
        console.error("Loi tao moi nutrition catalog: ", error)
        fs.unlinkSync("./" + req.file.path)
        res.status(500).json({ error: 'loi set nutrition' })
        res.end()
      });
  }

});

router.put('/updateNutritionCatalog', upload.single('photo'), function (req, res, next) {
  // chuan bi data
  let data = req.body
  if (!req.file) {
    fs.unlinkSync("./" + req.file.path)
    res.status(400).send("Error: No files found")
  } else {
    // cap nhat firestore
    let catalogRef = admin.firestore().collection("nutrition").doc(data.id)
    catalogRef.get().then((doc) => {
      if (!doc.exists) {
        console.log('No such document!');
        fs.unlinkSync("./" + req.file.path)
        res.status(400).send("Error: No Catalog")
      } else {
        console.log('Document data:', doc.data());
        var photoUrl = doc.data().photoUrl
        let oldPhotoPath = './public/data/uploads/' + photoUrl.substring(photoUrl.indexOf("uploads/") + 8)

        catalogRef.update({
          name: data.name,
          photoUrl: "https://" + req.hostname + req.file.path.substring(6)
        }).then(() => {
          try {
            fs.unlinkSync(oldPhotoPath)
            res.end(JSON.stringify({ id: data.id }))
          } catch (error) {
            fs.unlinkSync("./" + req.file.path)
            res.status(500).json({ error: 'loi xoa nutrition photo' })
            res.end()
          }

        }).catch((error) => {
          console.error(err)
          fs.unlinkSync("./" + req.file.path)
          res.status(500).json({ error: 'loi cap nhat nutrition' })
          res.end()
        })

      }
    }).catch((error) => {
      console.log("Error getting document:", error);
      fs.unlinkSync("./" + req.file.path)
      res.status(500).json({ error: 'loi khong doc duoc firestore' })
      res.end()
    });
  }
});

router.delete('/deleteNutritionCatalog', function (req, res, next) {
  let id = req.query.id
  // kiem tra ton tai
  let catalogRef = admin.firestore().collection("nutrition").doc(id)
  catalogRef.get().then((doc) => {
    if (!doc.exists) {
      res.status(400).send("Error: No Nutrition")
    } else {
      catalogRef.delete().then(() => {
        try {
          var photoUrl = doc.data().photoUrl
          let oldPhotoPath = './public/data/uploads/' + photoUrl.substring(photoUrl.indexOf("uploads/") + 8)
          fs.unlinkSync(oldPhotoPath)
          res.end(JSON.stringify({ id: id }))
        } catch (err) {
          res.status(500).json({ error: 'loi delete nutrition photo' })
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// nutrition menu

router.get('/menuList', function (req, res, next) {
  let data = req.query
  admin.firestore().collection("nutrition").doc(data.nutriId).collection("menuList").get().then((querySnapshot) => {
    var arr = []
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      var ob = doc.data()
      ob.id = doc.id
      arr.push(ob)
    });
    res.end(JSON.stringify(arr))

  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'something is wrong' })
    res.end()
  });
});

router.post('/newMenu', upload.array('pics'), function (req, res, next) {
  console.log("vao ham")
  // chuan bi data
  let data = req.body
  if (!req.files) {
    res.status(400).send("Error: No files found")
  } else {
    var imgUrls = []
    req.files.forEach(img => imgUrls.push("https://" + req.hostname + img.path.substring(6)))
    let menuListRef = admin.firestore().collection("nutrition").doc(data.nutriId).collection("menuList")
    menuListRef.add({
      breakfast: data.breakfast,
      picUrls: imgUrls,
      lunch: data.lunch,
      dinner: data.dinner,
      snack: data.snack,
      other: data.other
    })
      .then((menuRef) => {
        res.end(JSON.stringify({ id: menuRef.id }))
      })
      .catch((error) => {
        console.error("Loi tao moi menu: ", error)
        req.files.forEach(item => {
          fs.unlinkSync("./" + item.path)
        })
        res.status(500).json({ error: 'loi tao menu' })
        res.end()
      });
  }
});

router.put('/updateMenu', upload.array('pics'), function (req, res, next) {
  // chuan bi data
  let data = req.body
  let id = data.id

  console.log(imgUrls)
  if (!req.files) {
    res.status(400).send("Error: No files found")
  } else {
    var imgUrls = []
    req.files.forEach(img => imgUrls.push("https://" + req.hostname + img.path.substring(6)))
    // cap nhat firestore
    let excerciseRef = admin.firestore().collection("nutrition").doc(data.nutriId).collection("menuList").doc(id)
    excerciseRef.get().then((doc) => {
      if (!doc.exists) {
        console.log('No such document!---------');
        req.files.forEach(item => {
          fs.unlinkSync("./" + item.path)
        })
        res.status(400).send("Error: No nutrition")
      } else {
        var oldPhotoPaths = []
        var photoUrls = doc.data().picUrls
        photoUrls.forEach(url => oldPhotoPaths.push('./public/data/uploads/' + url.substring(url.indexOf("uploads/") + 8)))
        console.log(oldPhotoPaths)
        try {
          excerciseRef.update({
            breakfast: data.breakfast,
            picUrls: imgUrls,
            lunch: data.lunch,
            dinner: data.dinner,
            snack: data.snack,
            other: data.other
          }) // chua lam then

          oldPhotoPaths.forEach(ptPath => fs.unlinkSync(ptPath))
          //file removed

          res.end(JSON.stringify({ id: data.id }))
        } catch (err) {
          console.error(err)
          req.files.forEach(item => {
            fs.unlinkSync("./" + item.path)
          })
          res.status(500).json({ error: 'loi cap nhat firestore' })
          res.end()
        }
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
      req.files.forEach(item => {
        fs.unlinkSync("./" + item.path)
      })
      res.status(500).json({ error: 'loi khong doc duoc firestore' })
      res.end()
    });
  }
});

router.delete('/deleteMenu', function (req, res, next) {
  let id = req.query.id
  let nutriId = req.query.nutriId
  // kiem tra ton tai
  let menuRef = admin.firestore().collection("nutrition").doc(nutriId).collection("menuList").doc(id)
  menuRef.get().then((doc) => {
    if (!doc.exists) {
      res.status(400).send("Error: No Menu")
    } else {
      menuRef.delete().then(() => {
        try {
          var oldPhotoPaths = []
          var photoUrls = doc.data().picUrls
          photoUrls.forEach(url => oldPhotoPaths.push('./public/data/uploads/' + url.substring(url.indexOf("uploads/") + 8)))
          oldPhotoPaths.forEach(ptPath => fs.unlinkSync(ptPath))
          res.end(JSON.stringify({ id: id }))
        } catch (err) {
          console.log(err)
          res.status(500).json({ error: 'loi unlink' })
          res.end()
        }
      }).catch((error) => {
        res.status(500).json({ error: 'loi xoa catalog' })
        res.end()
      });

    }
  }).catch((error) => {
    res.status(500).json({ error: 'loi khong doc duoc firestore' })
    res.end()
  });

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// session
router.get('/userSessions', function (req, res, next) {
  let uid = req.query.uid
  admin.firestore().collection("user").doc(uid).collection("sessions").get().then((querySnapshot) => {
    var arr = []
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      var ob = doc.data()
      ob.id = doc.id
      arr.push(ob)
    });
    res.end(JSON.stringify(arr))
  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'something is wrong' })
    res.end()
  });
});

router.post('/newSession', function (req, res, next) {
  let data = req.body
  let uid = data.uid
  // check uid da co chua
  checkUserExist(uid, res, () => {
    let sessionsRef = admin.firestore().collection("user").doc(uid).collection("sessions")
    sessionsRef.add({
      name: data.name,
      time: "00:00"
    })
      .then((sessionRef) => {
        console.log("Tao moi session thanh cong")
        res.end(JSON.stringify({ id: sessionRef.id }))
      })
      .catch((error) => {
        console.error("Loi tao moi session cua user: ", error)
        res.status(500).json({ error: 'loi' })
        res.end()
      });
  })

});

function checkUserExist(uid, res, handle) {
  admin.firestore().collection("user").doc(uid).get().then((doc) => {
    if (!doc.exists) {
      console.log("khong ton tai user ")
      res.status(500).json({ error: 'khong ton tai user' })
      res.end()
    } else {
      handle()
    }
  })
}


router.put('/updateSession', function (req, res, next) {

  // chuan bi data
  let data = req.body
  // cap nhat firestore
  let sessionRef = admin.firestore().collection("user").doc(data.uid).collection("sessions").doc(data.sessionId)
  sessionRef.get().then((doc) => {
    if (!doc.exists) {
      console.log('No such document!');
      res.status(400).send("Error: No Catalog")
    } else {
      sessionRef.update({
        name: data.name
      }).then(() => {
        res.end(JSON.stringify({ id: data.sessionId }))
      }).catch((error) => {
        console.error(err)
        res.status(500).json({ error: 'loi cap nhat session' })
        res.end()
      })
    }
  }).catch((error) => {
    console.log("Error getting document:", error);
    res.status(500).json({ error: 'loi khong doc duoc firestore' })
    res.end()
  });
});

router.delete('/deleteSession', function (req, res, next) {
  let data = req.query
  // kiem tra ton tai
  let sessionRef = admin.firestore().collection("user").doc(data.uid).collection("sessions").doc(data.sessionId)
  sessionRef.get().then((doc) => {
    if (!doc.exists) {
      res.status(400).send("Error: No Session")
    } else {
      sessionRef.delete().then(() => {
        res.end(JSON.stringify({ id: data.sessionId }))
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// user_ex
router.get('/userExcercise', function (req, res, next) {
  let uid = req.query.uid
  let sessionId = req.query.sessionId
  admin.firestore().collection("user").doc(uid).collection("sessions").doc(sessionId).collection("ex_list").get().then((querySnapshot) => {
    var arr = []
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      var ob = doc.data()
      ob.id = doc.id
      arr.push(ob)
    });
    res.end(JSON.stringify(arr))
  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'something is wrong' })
    res.end()
  });
});

router.post('/newUserExc', function (req, res, next) {
  let data = req.body
  let uid = data.uid
  let sessionID = data.sessionID
  // check uid da co chua
  let sessListRef = admin.firestore().collection("user").doc(uid).collection("sessions").doc(sessionID)
  sessListRef.get().then((doc) => {
    if (doc.exists) {
      let userExRef = admin.firestore().collection("user").doc(uid).collection("sessions").doc(sessionID).collection("ex_list")
      userExRef.add({
        name: data.name,
        noTurn: parseInt(data.noTurn),
        noSec: parseInt(data.noSec),
        noGap: parseInt(data.noGap),
        autoplay: JSON.parse(data.autoplay)
      })
        .then((exRef) => {
          console.log("Tao moi session thanh cong")
          res.end(JSON.stringify({ id: exRef.id }))
        })
        .catch((error) => {
          console.error("Loi tao moi session cua user: ", error)
          res.status(500).json({ error: 'loi' })
          res.end()
        });
    } else {
      console.error("user hoac session khong ton tai: ", error)
      res.status(500).json({ error: 'user hoac session khong ton tai' })
      res.end()
    }
  }).catch((error) => {
    console.error("Loi doc session: ", error)
    res.status(500).json({ error: 'loi doc session' })
    res.end()
  })

});

router.put('/updateUserExc', function (req, res, next) {

  // chuan bi data
  let data = req.body
  // cap nhat firestore
  let excRef = admin.firestore().collection("user").doc(data.uid).collection("sessions").doc(data.sessionID).collection("ex_list").doc(data.id)
  excRef.get().then((doc) => {
    if (!doc.exists) {
      console.log('No such document!');
      res.status(400).send("Error: No Excercise")
    } else {
      excRef.update({
        name: data.name,
        noTurn: parseInt(data.noTurn),
        noSec: parseInt(data.noSec),
        noGap: parseInt(data.noGap),
        autoplay: JSON.parse(data.autoplay)
      }).then(() => {
        res.end(JSON.stringify({ id: data.id }))
      }).catch((error) => {
        console.error(err)
        res.status(500).json({ error: 'loi cap nhat excercise' })
        res.end()
      })
    }
  }).catch((error) => {
    console.log("Error getting document:", error);
    res.status(500).json({ error: 'loi khong doc duoc firestore' })
    res.end()
  });
});

router.delete('/deleteUserExc', function (req, res, next) {
  let data = req.query
  // kiem tra ton tai
  let excsRef = admin.firestore().collection("user").doc(data.uid).collection("sessions").doc(data.sessionId).collection("ex_list").doc(data.id)
  excsRef.get().then((doc) => {
    if (!doc.exists) {
      res.status(400).send("Error: No Exc")
    } else {
      excsRef.delete().then(() => {
        res.end(JSON.stringify({ id: data.sessionId }))
      }).catch((error) => {
        res.status(500).json({ error: 'loi xoa exc firestore' })
        res.end()
      });
    }
  }).catch((error) => {
    res.status(500).json({ error: 'loi khong doc duoc firestore' })
    res.end()
  });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// user_stat

router.get('/userStatHistory', function (req, res, next) {
  let uid = req.query.uid
  admin.firestore().collection("user").doc(uid).collection("statsHistory").get().then((querySnapshot) => {
    var arr = []
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      var ob = doc.data()
      ob.id = doc.id
      arr.push(ob)
    });
    res.end(JSON.stringify(arr))
  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'something is wrong' })
    res.end()
  });
});

router.post('/newUserStatHistory', function (req, res, next) {
  let data = req.body
  let uid = data.uid
  // check uid da co chua
  let userRef = admin.firestore().collection("user").doc(uid)
  userRef.get().then((doc) => {
    if (doc.exists) {
      let statsRef = admin.firestore().collection("user").doc(uid).collection("statsHistory")
      statsRef.add({
        dateString: data.dateString,
        weight: parseInt(data.weight),
        height: parseInt(data.height)
      })
        .then((sessionRef) => {
          console.log("Tao moi stats thanh cong")
          res.end(JSON.stringify({ id: sessionRef.id }))
        })
        .catch((error) => {
          console.error("Loi tao moi stats cua user: ", error)
          res.status(500).json({ error: 'loi' })
          res.end()
        });
    } else {
      res.status(500).json({ error: 'user khong ton tai' })
      res.end()
    }
  })

});

router.put('/updateUserStatHistory', function (req, res, next) {
  // chuan bi data
  let data = req.body
  // cap nhat firestore
  let statRef = admin.firestore().collection("user").doc(data.uid).collection("statsHistory").doc(data.statId)
  statRef.get().then((doc) => {
    if (!doc.exists) {
      console.log('No such document!');
      res.status(400).send("Error: No stat")
    } else {
      statRef.update({
        dateString: data.dateString,
        weight: parseInt(data.weight),
        height: parseInt(data.height)
      }).then(() => {
        res.end(JSON.stringify({ id: data.statId }))
      }).catch((error) => {
        console.error(err)
        res.status(500).json({ error: 'loi cap nhat stat' })
        res.end()
      })
    }
  }).catch((error) => {
    console.log("Error getting document:", error);
    res.status(500).json({ error: 'loi khong doc duoc firestore' })
    res.end()
  });
});

router.delete('/deleteUserStatHistory', function (req, res, next) {
  let data = req.query
  // kiem tra ton tai
  let sessionRef = admin.firestore().collection("user").doc(data.uid).collection("statsHistory").doc(data.statId)
  sessionRef.get().then((doc) => {
    if (!doc.exists) {
      res.status(400).send("Error: No statsHistory")
    } else {
      sessionRef.delete().then(() => {
        res.end(JSON.stringify({ id: data.statId }))
      }).catch((error) => {
        res.status(500).json({ error: 'loi xoa statsHistory firestore' })
        res.end()
      });
    }
  }).catch((error) => {
    res.status(500).json({ error: 'loi khong doc duoc firestore' })
    res.end()
  });

});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// user_step

router.get('/userStep', function (req, res, next) {
  let uid = req.query.uid
  admin.firestore().collection("user").doc(uid).collection("stepHistory").get().then((querySnapshot) => {
    var arr = []
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      var ob = doc.data()
      ob.id = doc.id
      arr.push(ob)
    });
    res.end(JSON.stringify(arr))
  }).catch((error) => {
    console.log("Error getting documents: ", error);
    res.status(500).json({ error: 'something is wrong' })
    res.end()
  });
});

router.post('/newUserStep', function (req, res, next) {
  let data = req.body
  let uid = data.uid
  // check uid da co chua
  let userRef = admin.firestore().collection("user").doc(uid)
  userRef.get().then((doc) => {
    if (doc.exists) {
      let statsRef = admin.firestore().collection("user").doc(uid).collection("stepHistory")
      statsRef.add({
        dateString: data.dateString,
        steps: parseInt(data.steps)
      })
        .then((sessionRef) => {
          console.log("Tao moi steps thanh cong")
          res.end(JSON.stringify({ id: sessionRef.id }))
        })
        .catch((error) => {
          console.error("Loi tao moi steps cua user: ", error)
          res.status(500).json({ error: 'loi' })
          res.end()
        });
    } else {
      res.status(500).json({ error: 'user khong ton tai' })
      res.end()
    }
  })

});

router.put('/updateUserStep', function (req, res, next) {
  // chuan bi data
  let data = req.body
  // cap nhat firestore
  let statRef = admin.firestore().collection("user").doc(data.uid).collection("stepHistory").doc(data.stepId)
  statRef.get().then((doc) => {
    if (!doc.exists) {
      console.log('No such document!');
      res.status(400).send("Error: No stepHistory")
    } else {
      statRef.update({
        dateString: data.dateString,
        steps: parseInt(data.steps)
      }).then(() => {
        res.end(JSON.stringify({ id: data.stepId }))
      }).catch((error) => {
        console.error(err)
        res.status(500).json({ error: 'loi cap nhat stepHistory' })
        res.end()
      })
    }
  }).catch((error) => {
    console.log("Error getting document:", error);
    res.status(500).json({ error: 'loi khong doc duoc firestore' })
    res.end()
  });
});

router.delete('/deleteUserStep', function (req, res, next) {
  let data = req.query
  // kiem tra ton tai
  let sessionRef = admin.firestore().collection("user").doc(data.uid).collection("stepHistory").doc(data.stepId)
  sessionRef.get().then((doc) => {
    if (!doc.exists) {
      res.status(400).send("Error: No stepHistory")
    } else {
      sessionRef.delete().then(() => {
        res.end(JSON.stringify({ id: data.stepId }))
      }).catch((error) => {
        res.status(500).json({ error: 'loi xoa stepHistory firestore' })
        res.end()
      });
    }
  }).catch((error) => {
    res.status(500).json({ error: 'loi khong doc duoc firestore' })
    res.end()
  });

});


module.exports = router;


