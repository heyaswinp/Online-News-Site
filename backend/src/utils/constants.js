// SJSU CMPE 226 Fall 2019 TEAM1

`use strict`

module.exports = {
	STATUS_CODE: {
		SUCCESS_STATUS: 200,
		CREATED_SUCCESSFULLY_STATUS: 201,
		ACCEPTED_STATUS: 202,
		NO_CONTENT_STATUS: 204,
		BAD_REQUEST_ERROR_STATUS: 400,
		UNAUTHORIZED_ERROR_STATUS: 401,
		FORBIDDEN_ERROR_STATUS: 403,
		NOT_FOUND_STATUS: 404,
		CONFLICT_ERROR_STATUS: 409,
		UNPROCESSABLE_ENTITY_STATUS: 422,
		INTERNAL_SERVER_ERROR_STATUS: 500,
		MOVED_PERMANENTLY: 301,
	},
	MESSAGES: {
		USER_NOT_FOUND: 'User not found',
		ARTICLE_NOT_FOUND: 'ARTICLE not found',
		EDITOR_DOES_NOT_EXIST: 'Editor does not exist',
		USER_ALREADY_EXISTS: 'An account with this email id already exists',
		USER_DETAILS_ALREADY_EXISTS: 'Username, email id or phone number already exists',
		AUTHORIZATION_FAILED: 'Authorization failed',
		USER_VALUES_MISSING: 'Email must be provided',
		ALREADY_SUBSCRIBED: 'User is already subscribed to this list',
		INVALID_RESULT: 'Invalid Result',
		NO_ARTICLE_PRESENT : 'No article present',
		NO_CATEGORY_PRESENT: 'No category available'
	}
}
