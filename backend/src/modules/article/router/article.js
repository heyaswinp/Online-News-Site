// SJSU CMPE 226 Fall 2019 TEAM1

`use strict`

import express from 'express'
let router = express.Router()
import articleController from '../controller/article'

router.post('/savearticle', articleController.saveArticle)
router.put('/modifyarticle', articleController.modifyArticle)
router.get('/view/:editorId/:articleId/:viewerId', articleController.getArticle)
router.get('/headlines',articleController.getHeadlines)
router.get('/headlines/editor/:editorId',articleController.getHeadlinesForEditor)
router.get('/category/list',articleController.getAllCategories)
router.get('/likes/:editorId/:articleId/:userId', articleController.getLikeStatus);
module.exports = router