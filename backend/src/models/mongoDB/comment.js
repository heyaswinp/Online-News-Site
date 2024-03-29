// SJSU CMPE 226 Fall 2019 TEAM1

import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  commentTime: {
    type: String,
    required: true
  }
});

export default mongoose.model('Comment', schema);