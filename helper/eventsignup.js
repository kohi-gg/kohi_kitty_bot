const { Schema, model } = require("mongoose");

const signupSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  userId: { type: String, required: true },
  role: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
});

module.exports = model("EventSignup", signupSchema);
