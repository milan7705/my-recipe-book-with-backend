const express = require('express');
const multer = require('multer');
const Recipe = require('../models/recipe');
const authCheck = require('../middleware/auth-check');
const router = express.Router();

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',

};

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error('Invalid mime type!')
        if(isValid) {
            error = null;
        }
        cb(error, "backend/images");
    },
    filename:(req, file, cb) => {
        const name = file.originalname.toLowerCase().split(' ').join('-');
        const extesion = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + extesion)
    }
});



  //POST
  router.post('', authCheck ,multer({storage: fileStorage}).single('image'),
  (req, res, next)=> {
    const url = req.protocol + '://' + req.get("host");
    const recipe = new Recipe({
        title: req.body.title,
        description: req.body.description,
        imagePath: url + "/images/" + req.file.filename,
        authorizedUser: req.userData.userId
    });
    recipe.save().then(createdRecipe => {
        res.status(201).json({
            message: 'Recipes added succesfully!',
            recipe: {
                ...createdRecipe,
                id: createdRecipe._id
            }
        });
    });
  });

//PUT
router.put('/:id', authCheck, multer({storage: fileStorage}).single('image'),
(req, res, next)=> {
    let imagePath = req.body.imagePath;
    if (req.file) {
    const url = req.protocol + '://' + req.get("host");
    imagePath = url + "/images/" + req.file.filename
    }
    const recipe = new Recipe({
        _id: req.body.id,
        title: req.body.title,
        description: req.body.description,
        imagePath: imagePath
    });
    Recipe.updateOne({_id: req.params.id, authorizedUser: req.userData.userId}, recipe)
        .then(result => {
          if(result.nModified > 0) {
            res.status(200).json( {message: 'Update successful!'});
          } else {
            res.status(401).json( {message: 'Not Authorized!'});

          }
        });
});

//GET
router.get('',(req, res, next)=> {
    Recipe.find().then(documents => {
        res.status(200).json(
            {
                message: 'Recipes fetch succesfully',
                recipes: documents
            }
        );
        });
});

router.get('/:id',(req, res, next)=> {
    Recipe.findById(req.params.id)
        .then(recipe => {
            if(recipe) {
                res.status(200).json(recipe);

            } else {
                res.status(404).json({ message: 'Recipe not found!'});
            }
        })
});

//DELETE
router.delete('/:id', authCheck, (req, res, next)=> {
    Recipe.deleteOne({ _id: req.params.id, authorizedUser: req.userData.userId })
    .then(result => {
      if(result.n > 0) {
        res.status(200).json( {message: 'Delete successful!'});
      } else {
        res.status(401).json( {message: 'Not Authorized!'});
      }
});
});

module.exports = router;
