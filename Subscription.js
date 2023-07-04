const mongoose = require("mongoose");
const globalConstants = require("../config/globalConstants");
const Schema = mongoose.Schema;

const SubscriptionSchema = new Schema(
  {
    productId: String,
    subscriptionId: String,
    customerId: String,
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    currentPeriodEnd: Number,
    cancelAtDate: Number,
    last4: String,
    freeSeats: Number,
    ownerId: String,
    sku: String,
    status: {
      type: String,
      enum: globalConstants.SUBSCRIPTION.STATUSES_ENUM,
    },
    source: {
      type: String,
      enum: globalConstants.SUBSCRIPTION.SOURCES_ENUM,
    },
  },
  { collection: "subscription" }
);

module.exports = mongoose.model("Subscription", SubscriptionSchema);
