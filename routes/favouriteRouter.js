const express = require('express');
const bodyParser = require('body-parser');
//const mongoose = require('mongoose');
const cors = require('./cors');
var authenticate = require('../authenticate');

const Favourites = require('../models/favorite');

const favouriteRouter = express.Router();

favouriteRouter.use(bodyParser.json());

favouriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favourites.findOne({user: req.user._id})
    .populate('dishes')
    .then((favourites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favourites);
    })
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.findOne({user: req.user._id})
    .populate('user')
    .then(favourite => {
        if(!favourite) {
            Favourites.create({dishes: req.body}, function(err, favourite){
                if(err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({err: err});
                }
                favourite.user = req.user._id
                favourite.save(function(err, favourite){
                    if(err) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({err: err});
                    }
                    res.json(favourite)
                })
            })
        } else {
            var dish = req.body
            dish.map(item => {
                if(favourite.dishes.indexOf(item._id) == -1) {
                    favourite.dishes.push({_id: item._id})
                }
            })
            favourite.save(function(err, favourite){
                if(err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({err: err});
                }
                res.json(favourite)
            })
        }
    })
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favourites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.findOneAndDelete({user: req.user._id}, (err, result) => {
        if(err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({err: err});
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(result);
      }) 
});

favouriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favourites.findOne({user: req.user._id})
    .populate('dishes')
    .then((favourite) => {
        if(favourite) {
            const dish = favourite.dishes.find(item => item._id == req.params.dishId)
            if(dish) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish);
            } else {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end('This dish is not in your favorite list!');
            }
        } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end('This dish is not in your favorite list!');
        }
    })
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.findOne({user: req.user._id})
    .populate('user')
    .then(favourite => {
        if(!favourite) {
            Favourites.create({dishes: [{_id: req.params.dishId}]}, function(err, favourite){
                if(err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({err: err});
                }
                favourite.user = req.user._id
                favourite.save(function(err, favourite){
                    if(err) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({err: err});
                    }
                    res.json(favourite)
                })
            })
        } else {
            var dish = req.params.dishId
            if(favourite.dishes.indexOf(dish) == -1) {
                favourite.dishes.push({_id: dish})
            }
            favourite.save(function(err, favourite){
                if(err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({err: err});
                }
                res.json(favourite)
            })
        }
    })
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favourites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    var dishId = req.params.dishId
    Favourites.findOne( {user: req.user._id},
        function(err, fav) { 
            if(err) next(err)
            if (fav) {
                fav.dishes.pull(dishId)
                fav.save(function (err) {
                    if(err) next(err)
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(fav);
                });
            }
        }
    )
    .catch((err) => next(err));
});

module.exports = favouriteRouter;