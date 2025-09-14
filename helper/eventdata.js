const { Schema, model } = require("mongoose");

const eventSchema = new Schema({
  threadId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  hostId: { type: String, required: true },
  title: { type: String, required: true },
  contentType: { type: String, required: true },
  group: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
  isClosed: { type: Boolean, default: false }
});

module.exports = model("Event", eventSchema);
