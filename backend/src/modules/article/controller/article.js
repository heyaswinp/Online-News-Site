// SJSU CMPE 226 Fall 2019 TEAM1

'use strict'


import constants from '../../../utils/constants'
import SQLConnection from '../../../models/sqlDB/index'
import SQLQueries from '../../../models/sqlDB/articleQueries'
import SQLHelper from '../../../models/sqlDB/helper'
import Article from '../../../models/mongoDB/article'
import logger from '../../../../config/logger';

/**
 * Save a article written by the editor in database.
 * @param  {Object} req request object
 * @param  {Object} res response object
 */
exports.saveArticle = async (req, res) => {
	let mongoConnection = await Article.startSession();
  mongoConnection.startTransaction();
	await SQLConnection.beginTransaction()

  logger.info('Inside ' + req.originalUrl + ' Body ' + JSON.stringify(req.body));
  try {
		var query
		var articleData = req.body
		var date = new Date();
		var article_id
		var create_time = date.toISOString().slice(0, 19).replace('T', ' ');

		query = SQLQueries.getNameOfEditor(articleData.editor_id)
		var result = await SQLHelper(query)

		if (result.length <= 0) {
      logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.CONFLICT_ERROR_STATUS + constants.MESSAGES.EDITOR_DOES_NOT_EXIST);
      return res
				.status(constants.STATUS_CODE.CONFLICT_ERROR_STATUS)
				.send(constants.MESSAGES.EDITOR_DOES_NOT_EXIST)
		}
		const editorName = result[0].name

		query = SQLQueries.getPreviousArticleCount(articleData.editor_id)
		var result = await SQLHelper(query)
		if (result.length > 0) {
			if (result[0].previous_article_no != null) {
				article_id = result[0].previous_article_no + 1
			} else {
				article_id = 1;
			}
		}

		query = SQLQueries.addArticle(articleData.editor_id, article_id, articleData.headlines, articleData.body, create_time)
		await SQLConnection.query(query)
		var categories = articleData.categories
		for (var i = 0; i < categories.length; i++) {
			query = SQLQueries.saveBelongsTo(articleData.editor_id, article_id, categories[i])
			await SQLConnection.query(query)
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
		await mongoConnection.commitTransaction();
		await mongoConnection.endSession();
		await SQLConnection.commit()

    logger.info('Returning from ' + req.originalUrl + constants.STATUS_CODE.CREATED_SUCCESSFULLY_STATUS + JSON.stringify(createdArticle));

    return res
			.status(constants.STATUS_CODE.CREATED_SUCCESSFULLY_STATUS)
			.send(createdArticle)
	} catch (error) {
		console.log(`Error while saving article ${error}`)
		await mongoConnection.abortTransaction();
		await mongoConnection.endSession();
		await SQLConnection.rollback()

    logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS + error.message);
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
  logger.info('Inside ' + req.originalUrl + ' Body ' + JSON.stringify(req.body));
  try {

		var query
		var articleData = req.body
		var date = new Date();
		var modified_time = date.toISOString().slice(0, 19).replace('T', ' ');

		query = SQLQueries.getNameOfEditor(articleData.editor_id)
		var result = await SQLHelper(query)

		if (result.length <= 0) {
      logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.CONFLICT_ERROR_STATUS + constants.MESSAGES.EDITOR_DOES_NOT_EXIST);
			return res
				.status(constants.STATUS_CODE.CONFLICT_ERROR_STATUS)
				.send(constants.MESSAGES.EDITOR_DOES_NOT_EXIST)
		}

		query = SQLQueries.updateArticle(articleData.body, modified_time, articleData.article_id, articleData.editor_id)
		var result = await SQLHelper(query)

    logger.info('Returning from ' + req.originalUrl + constants.STATUS_CODE.CREATED_SUCCESSFULLY_STATUS + " Updated Article Successfully");

    return res
			.status(constants.STATUS_CODE.CREATED_SUCCESSFULLY_STATUS)
			.send("Updated Article Successfully")
	} catch (error) {

    logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS + error.message);
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
  logger.info('Inside ' + req.originalUrl);
  try {
		var query
		var type = req.query.type
		if (type.toLowerCase() == 'all') {
			var result = await Article.find({})

      logger.info('Returning from ' + req.originalUrl + constants.STATUS_CODE.SUCCESS_STATUS + JSON.stringify(result.reverse()));
      return res
				.status(constants.STATUS_CODE.SUCCESS_STATUS)
				.send(result.reverse())
		} else {
			query = SQLQueries.isValidCategoryName(type)
			var exists = await SQLHelper(query)
			if (exists[0][0].TRUE) {
				console.log("Invalid option")

        logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.BAD_REQUEST_ERROR_STATUS + " Invalid option : " + type);
				return res
					.status(constants.STATUS_CODE.BAD_REQUEST_ERROR_STATUS)
					.send("Invalid option : " + type)
			}

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

      logger.info('Returning from ' + req.originalUrl + constants.STATUS_CODE.SUCCESS_STATUS + JSON.stringify(result.reverse()));
      return res
				.status(constants.STATUS_CODE.SUCCESS_STATUS)
				.send(allHeadlines.reverse())
		}

	} catch (error) {
		console.log(`Error while retrieving headlines ${error}`)

    logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS + error.message);
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
  logger.info('Inside ' + req.originalUrl);

  try {
		var resultArticle = {}
		var query = SQLQueries.getArticle(req.params.articleId, req.params.editorId)
		var article = await SQLHelper(query)
		if (article.length <= 0) {
      logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.BAD_REQUEST_ERROR_STATUS + constants.MESSAGES.USER_NOT_FOUND);
			return res
				.status(constants.STATUS_CODE.BAD_REQUEST_ERROR_STATUS)
				.send(constants.MESSAGES.USER_NOT_FOUND)
		} else {
			resultArticle.name = article[0].name
			resultArticle.headlines = article[0].headlines
			resultArticle.body = article[0].body
			if (article[0].modified_time != null) {
				resultArticle.lastModified = article[0].modified_time
			} else {
				resultArticle.lastModified = article[0].create_time
			}
			let mQ = await Article.findOne({ articleId: req.params.articleId, editorId: req.params.editorId });
			resultArticle.likeCount = mQ.likeCount;
			resultArticle.commentCount = mQ.commentCount;
			resultArticle.readCount = mQ.readCount;
			resultArticle.comments = mQ.comments;
		}

		query = SQLQueries.getBelongsTO(req.params.articleId, req.params.editorId)
		var categories = await SQLHelper(query)
		if (categories.length <= 0) {
      logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.BAD_REQUEST_ERROR_STATUS + constants.MESSAGES.INVALID_RESULT);
			return res
				.status(constants.STATUS_CODE.BAD_REQUEST_ERROR_STATUS)
				.send(constants.MESSAGES.INVALID_RESULT)
		} else {
			var allCategories = []
			for (var index in categories) {
				allCategories.push(categories[index].name)
			}
			resultArticle.categories = allCategories
		}

		const viewerId = req.params.viewerId;

		if (viewerId !== "Editor") {
			query = SQLQueries.updateViews(viewerId, req.params.editorId, req.params.articleId);
			var result = await SQLHelper(query)
			console.log(JSON.stringify(result));

			/*
			Maintaing readCount seperately, this way, for quickview, we can avoid SQL queries.
			*/
			let condition = {
				articleId: req.params.articleId,
				editorId: req.params.editorId
			};

			await Article.findOneAndUpdate(condition, { $inc: { readCount: 1 } }, { new: true });
			resultArticle.readCount++;
		}

    logger.info('Returning from ' + req.originalUrl + constants.STATUS_CODE.SUCCESS_STATUS + JSON.stringify(resultArticle));
    return res
			.status(constants.STATUS_CODE.SUCCESS_STATUS)
			.send(resultArticle)
	} catch (error) {
		console.log(`Error while  retrieving article ${error}`)

    logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS + error.message);
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
  logger.info('Inside ' + req.originalUrl);
  try {
		let query = SQLQueries.getAllCategories();
		var categories = await SQLHelper(query)
		if (categories.length <= 0) {
      logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.NOT_FOUND_STATUS + constants.MESSAGES.NO_CATEGORY_PRESENT);
			return res
				.status(constants.STATUS_CODE.NOT_FOUND_STATUS)
				.send(constants.MESSAGES.NO_CATEGORY_PRESENT)
		} else {
      logger.info('Returning from ' + req.originalUrl + constants.STATUS_CODE.SUCCESS_STATUS + JSON.stringify(categories));
      return res
				.status(constants.STATUS_CODE.SUCCESS_STATUS)
				.send(categories)
		}
	} catch (error) {
    logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS + error.message);
		return res
			.status(constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS)
			.send(error.message)
	}

}

exports.getLikeStatus = async (req, res) => {
  logger.info('Inside ' + req.originalUrl);

  try {
		let query = SQLQueries.hasUserLikedTheArticle(req.params.userId, req.params.articleId, req.params.editorId)
		let result = await SQLHelper(query);
		let likeStatus = {};
		if (result[0][0].TRUE) {
			likeStatus.status = true;
		}
		else {
			likeStatus.status = false;
		}

    logger.info('Returning from ' + req.originalUrl + constants.STATUS_CODE.SUCCESS_STATUS + JSON.stringify(likeStatus));

    return res
			.status(constants.STATUS_CODE.SUCCESS_STATUS)
			.send(likeStatus);
	} catch (error) {
    logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS + error.message);
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
  logger.info('Inside ' + req.originalUrl);

  try {
		var result = await Article.find({
			editorId: req.params.editorId
		})

    logger.info('Returning from ' + req.originalUrl + constants.STATUS_CODE.SUCCESS_STATUS + JSON.stringify(result.reverse()));

    return res
			.status(constants.STATUS_CODE.SUCCESS_STATUS)
			.send(result.reverse())
	} catch (error) {
		console.log(`Error while retrieving headlines ${error}`)

    logger.info('Error in ' + req.originalUrl + constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS + error.message);
		return res
			.status(constants.STATUS_CODE.INTERNAL_SERVER_ERROR_STATUS)
			.send(error.message)
	}

}