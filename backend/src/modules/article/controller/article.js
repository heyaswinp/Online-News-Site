// SJSU CMPE 226 Fall 2019 TEAM1

'use strict'


import constants from '../../../utils/constants'
import mongoose from 'mongoose'
import SQLQueries from '../../../models/sqlDB/articleQueries'
import SQLHelper from '../../../models/sqlDB/helper'
import Article from '../../../models/mongoDB/article'


/**
 * Save a article written by the editor in database.
 * @param  {Object} req request object
 * @param  {Object} res response object
 */
exports.saveArticle = async (req, res) => {
	try {
		var query
		var articleData = req.body
		var date = new Date();
		var article_id 
		var create_time =  date.toISOString().slice(0, 19).replace('T', ' ');

		// query = "SELECT name FROM editor WHERE editor_id = '" + articleData.editor_id + "'"
		query = SQLQueries.getNamesOfAllEditors(articleData.editor_id)
		var result = await SQLHelper(query)
		
		if (result.length <= 0) {
			return res
				.status(constants.STATUS_CODE.CONFLICT_ERROR_STATUS)
				.send(constants.MESSAGES.EDITOR_DOES_NOT_EXIST)
		}
		const editorName = result[0].name
		
		// query = "SELECT max(article_id) AS previous_article_no FROM article WHERE editor_id = '" + articleData.editor_id +"'"
		query = SQLQueries.getPreviousArticleCount(articleData.editor_id)
		var result = await SQLHelper(query)
		if(result.length > 0){
			if(result[0].previous_article_no != null){
				article_id = result[0].previous_article_no + 1
			}else{
				article_id = 1;
			}
		}

		// query = "INSERT INTO article (editor_id, article_id , headlines, body, create_time) VALUES ('" + articleData.editor_id + "','"+ article_id +"','" + articleData.headlines + "', '" + articleData.body + "', '" + create_time + "')"
		query = SQLQueries.addArticle(articleData.editor_id, article_id, articleData.headlines, articleData.body, create_time )
		var result = await SQLHelper(query)
		
		var categories = articleData.categories
		for(var i =0 ;i < categories.length ; i++){
			// query = "INSERT INTO belongs_to VALUES ('" + articleData.editor_id + "','"+ article_id + "','"+ categories[i] + "')"
			query = SQLQueries.saveBelongsTo(articleData.editor_id, article_id, categories[i])
			var result = await SQLHelper(query)
			// console.log("Result : " + JSON.stringify(result, null, 2))	
		}


		/*
		Creating a new article document in Article collection.
		 */
		let newArticle = new Article({
			articleId: article_id,
			editorId: articleData.editor_id,
			editorName: editorName,
			headline: articleData.headlines,
			categories: articleData.categories,
			readCount: 0,
			likeCount: 0,
			commentCount: 0,
			comments: []
		});

		let createdArticle = await newArticle.save();
		// console.log(createdArticle);



		return res
			.status(constants.STATUS_CODE.CREATED_SUCCESSFULLY_STATUS)
			.send(createdArticle)
	} catch (error) {
		console.log(`Error while saving article ${error}`)
		return res
			.status(constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS)
			.send(error.message)
	}
}

/**
 * Update a article written by the editor in database.
 * @param  {Object} req request object
 * @param  {Object} res response object
 */
exports.modifyArticle = async (req, res) => {
	try {

		var query
		var articleData =   req.body
		var date = new Date();
		var modified_time =  date.toISOString().slice(0, 19).replace('T', ' ');

		// query = "SELECT name FROM editor WHERE editor_id = '" + articleData.editor_id + "'"
		query = SQLQueries.getNamesOfAllEditors(articleData.editor_id)
		var result = await SQLHelper(query)
		
		if (result.length <= 0) {
			return res
				.status(constants.STATUS_CODE.CONFLICT_ERROR_STATUS)
				.send(constants.MESSAGES.EDITOR_DOES_NOT_EXIST)
		}
		
		// query = "UPDATE article SET body='" +articleData.body + "', modified_time='" + modified_time + "' WHERE article_id ='" + articleData.article_id +"' AND editor_id ='" + articleData.editor_id +"'"
		query = SQLQueries.updateArticle(articleData.body, modified_time, articleData.article_id, articleData.editor_id)
		var result = await SQLHelper(query)
		
		return res
			.status(constants.STATUS_CODE.CREATED_SUCCESSFULLY_STATUS)
			.send("Updated Article Successfully")
	} catch (error) {
		return res
			.status(constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS)
			.send(error.message)
	}

}

/**
 * Update a article written by the editor in database.
 * @param  {Object} req request object
 * @param  {Object} res response object
 */
exports.getHeadlines = async (req, res) => {
	try {

		var query
		var type = req.query.type
		if(type.toLowerCase() == 'all'){
			var result = await Article.find({})
			return res
			.status(constants.STATUS_CODE.SUCCESS_STATUS)
			.send(result.reverse())
		}else{
			// query = "SELECT name FROM category WHERE name='" + type +"'"
			query = SQLQueries.getAllCategoryNames(type)
			var exists =await SQLHelper(query)
			if(exists.length <= 0){
				console.log("Invalid option")
				return res
				.status(constants.STATUS_CODE.BAD_REQUEST_ERROR_STATUS)
				.send("Invalid option : " + type)
			}

			// query = `SELECT article_id, editor_id ` +
			// 		`FROM belongs_to `+
			// 		`WHERE name = "${type}"` ;
			query = SQLQueries.getBelongingArticles(type)
			var result = await SQLHelper(query)	
			let allHeadlines = []	
			for (var index in result) {
				var temp = await Article.findOne({
					editorId: result[index].editor_id,
					articleId: result[index].article_id
				})
				if (temp) {
					allHeadlines.push(temp)
				}
				
			}
			return res
			.status(constants.STATUS_CODE.SUCCESS_STATUS)
			.send(allHeadlines.reverse())
		}
		
	} catch (error) {
		console.log(`Error while retrieving headlines ${error}`)
		return res
			.status(constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS)
			.send(error.message)
	}

}


/**
 * Update a article written by the editor in database.
 * @param  {Object} req request object
 * @param  {Object} res response object
 */
exports.getArticle = async (req, res) => {

	var query
	var resultArticle ={}
	try {
		
		query = "SELECT name, headlines, body, create_time, modified_time " +
				"FROM article NATURAL JOIN editor " +
				"WHERE article_id ='" + req.params.articleId + "' AND editor_id ='" + req.params.editorId +"'"
		var article = await SQLHelper(query)
		if (article.length <= 0) {
			return res
				.status(constants.STATUS_CODE.BAD_REQUEST_ERROR_STATUS)
				.send(constants.MESSAGES.USER_NOT_FOUND)
		}else{
			resultArticle.name = article[0].name
			resultArticle.headlines = article[0].headlines
			resultArticle.body = article[0].body
			if(article[0].modified_time != null){
				resultArticle.lastModified = article[0].modified_time
			}else{
				resultArticle.lastModified = article[0].create_time
			}

			let mQ = await Article.findOne({ articleId: req.params.articleId, editorId: req.params.editorId });
			//console.log(mQ);
			resultArticle.likeCount = mQ.likeCount;
			resultArticle.commentCount = mQ.commentCount;
			resultArticle.readCount = mQ.readCount;
			resultArticle.comments = mQ.comments;
		}
		
		query = "SELECT name " + 
				"FROM belongs_to " +
				"WHERE article_id ='" + req.params.articleId + "' AND editor_id ='" + req.params.editorId +"'"
		var categories = await SQLHelper(query)
		if (categories.length <= 0) {
			return res
				.status(constants.STATUS_CODE.BAD_REQUEST_ERROR_STATUS)
				.send(constants.MESSAGES.INVALID_RESULT)
		}else{
			var allCategories = []
			for (var index in categories) {
				allCategories.push(categories[index].name)
			}
			resultArticle.categories = allCategories
		}

		const viewerId = req.params.viewerId;
		
		if(viewerId !== "Editor"){
			
			query = `INSERT INTO views (user_id,editor_id,article_id,r_time) VALUES (${viewerId},${req.params.editorId},${ req.params.articleId}, NOW())`
			var result = await SQLHelper(query)
			console.log(JSON.stringify(result));

			
			/*
			Maintaing readCount seperately, this way, for quickview, we can avoid SQL queries.
			*/
			let condition = {
				articleId: req.params.articleId,
				editorId: req.params.editorId
			};

			let r = await Article.findOneAndUpdate(condition, { $inc: { readCount: 1 } }, {new : true});
			resultArticle.readCount ++;
			//console.log(r);
		}


		
		
		return res
			.status(constants.STATUS_CODE.SUCCESS_STATUS)
			.send(resultArticle)
	} catch (error) {
		console.log(`Error while  retrieving article ${error}`)
		return res
			.status(constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS)
			.send(error.message)
	}

}


/**
 * Get list of categories available.
 * @param  {Object} req request object
 * @param  {Object} res response object
 */
exports.getAllCategories = async (req, res) => {

	try {
		let query ="SELECT name FROM category";
		var categories = await SQLHelper(query)
		if (categories.length <= 0) {
			return res
				.status(constants.STATUS_CODE.NOT_FOUND_STATUS)
				.send(constants.MESSAGES.NO_CATEGORY_PRESENT)
		}else{
			return res
				.status(constants.STATUS_CODE.SUCCESS_STATUS)
				.send(categories)
		}
	} catch (error) {
		return res
			.status(constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS)
			.send(error.message)
	}

}

exports.getLikeStatus = async (req, res) => {
	try {
		let query = `SELECT * FROM likes WHERE user_id=${req.params.userId} and article_id=${req.params.articleId} and editor_id=${req.params.editorId}`;
		let result = await SQLHelper(query);

		let likeStatus = {};
		if(JSON.parse(JSON.stringify(result)).length > 0) {
			likeStatus.status = true;
		}
		else {
			likeStatus.status = false;
		}

		return res
			.status(constants.STATUS_CODE.SUCCESS_STATUS)
			.send(likeStatus);
	} catch (error) {
		return res
			.status(constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS)
			.send(error.message);
	}
}


/**
 * Get headlines for articles written by a editor.
 * @param  {Object} req request object
 * @param  {Object} res response object
 */
exports.getHeadlinesForEditor = async (req, res) => {

	try {
		var result = await Article.find({
			editorId : req.params.editorId
		})
		return res
			.status(constants.STATUS_CODE.SUCCESS_STATUS)
			.send(result.reverse())
		
	} catch (error) {
		console.log(`Error while retrieving headlines ${error}`)
		return res
			.status(constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS)
			.send(error.message)
	}

}