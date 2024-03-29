import logger from '../../../config/logger';
import getTime from '../../utils/getTime';

// This query will store user information in the database
exports.createUser = (name, DOB, location, sex, email, password) => {
    let query = "INSERT INTO user (name, DOB, location, sex, email, password) VALUES ('" + name + "', '" + DOB + "', '" + location + "', '" + sex + "', '" + email + "', '" + password + "')"

  logger.info('Executing Query ' + query);
    return query
}

// This query will retreive user_id, name and password for user with the given email
exports.loginUser = (email) => {
    let query = "SELECT user_id, name, password from user where email = '" + email + "'"

  logger.info('Executing Query ' + query);
    return query
}

// This query will retreive editor_id, name and password for editor with the given email
exports.loginEditor = (email) => {
    let query = "SELECT editor_id as user_id, name, password from editor where email = '" + email + "'"

  logger.info('Executing Query ' + query);
    return query
}

// This query will retreive all user details for a given ID
exports.getUserDetails = (userId) => {
    let query = "SELECT email, name, sex, DOB, location from user where user_id = '" + userId + "'"

  logger.info('Executing Query ' + query);
    return query
}

// This stored procedure will check if the email id already exists for user other than their userId and return true or false
exports.checkDuplicateEmailForUser = (email, userId) => {
    let query = `CALL checkDuplicateEmailForUser("${email}", ${userId})`

  logger.info('Executing Query ' + query);
    return query
}

// This stored procedure will check if the email id already exists for an editor and return true or false
exports.doesEmailExistForEditor = (email) => {
    let query = `CALL doesEmailExistForEditor("${email}")`

  logger.info('Executing Query ' + query);
    return query
}

// This stored procedure updates the user information which has been provided by the user
exports.updateUserInformation = (email, password, name, sex, DOB, location, userId) => {
    let query
    if (password) {
        query = `CALL updateUserInformation("${email}", "${password}", "${name}", "${sex}", "${DOB}", "${location}", ${userId})`
    } else {
        query = `CALL updateUserInformation("${email}", ${password}, "${name}", "${sex}", "${DOB}", "${location}", ${userId})`
    }

  logger.info('Executing Query ' + query);
    return query
}

// This query will retreive name, editor_id, article_id, headlines, time and status for all newly posted articles in the category a user has subscribed to,
// and the same information for all articles that has been modified in the category a user has subscribed to,
// and finally same information for any comments that has been done on an article where the user has already commented
// All of these records are sorted by timestamp in descending order i.e Latest notification first 
exports.getNotifications = (userId) => {
    let query = "( " +
        "SELECT NULL as name, A.editor_id as editor_id, A.article_id as article_id, A.headlines as headlines, A.create_time as time, 'NEW' as status " +
        "FROM article A JOIN ( " +
        "SELECT editor_id, article_id, name, s_time " +
        "FROM belongs_to NATURAL JOIN ( " +
        "SELECT name, s_time " +
        "FROM subscribed_to " +
        "WHERE user_id = " + userId +
        ") innerTable " +
        ") B ON A.editor_id = B.editor_id AND A.article_id = B.article_id AND A.create_time > B.s_time " +
        ") " +
        "UNION" +
        " ( " +
        "SELECT NULL as name, A.editor_id as editor_id, A.article_id as article_id, A.headlines as headlines, A.modified_time as time, 'MODIFIED' as status " +
        "FROM article A JOIN ( " +
        "SELECT editor_id, article_id, name, s_time " +
        "FROM belongs_to NATURAL JOIN ( " +
        "SELECT name, s_time " +
        "FROM subscribed_to " +
        "WHERE user_id =" + userId +
        ") innerTable " +
        ") B ON A.editor_id = B.editor_id AND A.article_id = B.article_id AND A.modified_time > B.s_time " +
        ") " +
        "UNION" +
        " ( " +
        "SELECT name, editor_id, article_id, headlines, c_time as time, 'COMMENTS' as status " +
        "FROM comments NATURAL JOIN ( " +
        "SELECT min(c_time) AS mintime, editor_id, article_id " +
        "FROM comments " +
        "WHERE user_id = " + userId + " " +
        "GROUP BY editor_id, article_id " +
        ") A NATURAL JOIN article NATURAL JOIN user " +
        "WHERE user_id != " + userId + " AND mintime <= c_time " +
        ") " +
        "ORDER BY time desc";

  logger.info('Executing Query ' + query);
    return query
}

// This query will add a record of user liking an article
exports.addLikes = (user_id, article_id, editor_id) => {
    let query = `INSERT INTO` +
        ` likes (user_id, article_id, editor_id, l_time)` +
        ` VALUES ( ${user_id} , ${article_id} , ${editor_id} , '${getTime.getTime()}' );`;

  logger.info('Executing Query ' + query);
    return query;
}

// This query will add a record of user commenting an article
exports.commentOnArticle = (user_id, article_id, editor_id, text) => {
    let query = `INSERT INTO` +
        ` comments (user_id, article_id, editor_id, text, c_time)` +
        ` VALUES ( ${user_id} , ${article_id} , ${editor_id} , '${text}' , '${getTime.getTime()}' );`;

  logger.info('Executing Query ' + query);
    return query
}

// This query will add a record of user subscribing to a category
exports.subscribeToACategory = (user_id, category_name) => {
    let query = `INSERT INTO` +
        ` subscribed_to (user_id, name, s_time)` +
        ` VALUES ( ${user_id} , '${category_name}' , '${getTime.getTime()}' );`;

  logger.info('Executing Query ' + query);
    return query;
}

// This query will fetch the article details of all the articles viewed by a particular user
exports.getViews = (userId) => {
    let query = `SELECT A.article_id, A.editor_id, A.headlines content,  r_time time, 'viewed' as type` +
        ` FROM views V, article A` +
        ` WHERE V.user_id = ${userId} and V.article_id = A.article_id and V.editor_id = A.editor_id;`;

  logger.info('Executing Query ' + query);
    return query;
}

// This query will fetch the article details of all the articles liked by a particular user
exports.getLikes = (userId) => {
    let query = `SELECT A.article_id, A.editor_id, A.headlines content, l_time time, 'liked' as type ` +
        ` FROM likes L, article A` +
        ` WHERE L.user_id = ${userId} and L.article_id = A.article_id and L.editor_id = A.editor_id;`;

  logger.info('Executing Query ' + query);
    return query;
}

// This query will fetch the category details of all the articles in a particular user
exports.getSubscribes = (userId) => {
    let query = `SELECT null as article_id, null as editor_id, C.name content, s_time time, 'subscribed' as type ` +
        ` FROM subscribed_to S, category C` +
        ` WHERE S.user_id = ${userId} and S.name = C.name;`;

  logger.info('Executing Query ' + query);
    return query;
}

// This query will fetch names of all categories a user has subscribed to
exports.getSubscribedTo = (userId) => {
    let query = `SELECT name ` +
        ` FROM subscribed_to ` +
        ` WHERE user_id = ${userId};`;

  logger.info('Executing Query ' + query);
    return query;
}