// Require Mongoose
let mongoose = require("mongoose");
let moment = require("moment");
const HttpStatus = require("http-status-codes");
const fs = require("fs");
const mailer = require("../helpers/mailer");
const util = require("../helpers/util");
const ENV_CONSTANTS = require("../config/envs");
const errorHandler = require("../helpers/errorHandler");
const ScheduledMeeting = require("./ScheduledMeeting");

require.extensions[".html"] = function (module, filename) {
  module.exports = fs.readFileSync(filename, "utf8");
};

// Define a schema
let Schema = mongoose.Schema;

let InviteCodeSchema = new Schema(
  {
    _id: String,
    fullCode: String,
    status: String,
    email: String,
    scheduledMeetingId: { type: mongoose.Schema.Types.ObjectId, ref: "ScheduledMeeting" },
    expireAt: { type: Date, default: null },
    createdAt: { type: Date },
    isGeneric: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    inviteesForGenericCode: [String],
  },
  { collection: "invite_codes" }
);

InviteCodeSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
InviteCodeSchema.statics.CONSTANTS = {
  FIELDS: {
    SHORT_CODE: "shortCode",
    FULL_CODE: "fullCode",
    STATUS: "status",
    EMAIL: "email",
  },
  PARAMS: {
    SHORT_CODE: "shortCode",
    FULL_CODE: "fullCode",
    STATUS: "status",
    INVITER_ID: "inviterId",
    INVITEE_EMAIL: "inviteeEmail",
    MEETING_ID: "meetingId",
    CLIENT: "client",
    TEAM_ID: "teamId",
    EMAIL: "email",
  },
  STATUSES: {
    VALID: "valid",
    INVALID: "invalid",
    EXPIRED: "expired",
  },
};

InviteCodeSchema.statics.sendInviteEmail = async (
  User,
  Meeting,
  inviteCode,
  inviterId,
  inviteeEmail,
  meetingId,
  isNewPortal = true,
  teamId,
  clientKey,
  isGeneric
) => {
  let [inviter, meeting, invitee] = await Promise.all([
    User.findOne({ _id: inviterId }),
    Meeting.findOne({ meetingId: meetingId, status: Meeting.CONSTANTS.STATUSES.IN_PROGRESS }),
    User.findOne({ email: inviteeEmail.toLowerCase() }),
  ]);
  const template =
    isGeneric && invitee?._id
      ? require("../templates/generic-invite-code--registered-user.html")
      : isGeneric && !invitee?._id
      ? require("../templates/generic-invite-code--unregistered-user.html")
      : require("../templates/invite-active-meeting.html");
  const URls = isNewPortal ? ENV_CONSTANTS.newPortalUrl : ENV_CONSTANTS.joinUrl;

  let data = {
    inviterName: inviter.first_name + " " + inviter.last_name,
    inviterEmail: process.env.EMAIL_USERNAME,
    meetingTitle: meeting?.title ? meeting.title : "Arthur Meeting",
  };

  if (!isGeneric && meeting) {
    let meetingDateTime = moment(meeting?.startDateTime);
    let invitationLink = invitee?._id
      ? `${URls}rooms/${clientKey}/${teamId}/${meetingId}`
      : `${URls}join?joining=${clientKey}&joining=${teamId}&joining=${meetingId}&joining=${inviteeEmail.toLowerCase()}&joining=${
          inviter._id
        }`;
    data.invitationLink = invitationLink;
    data.meetingDate = meetingDateTime.format("D");
    data.meetingDay = meetingDateTime.format("dddd");
    data.meetingMonth = meetingDateTime.format("MMMM");
    data.meetingYear = meetingDateTime.format("YYYY");
  }
  if (isGeneric) {
    data.inviteCode = inviteCode.replace(/^(.{3})(.*)$/, "$1 $2");
  }
  data.inviterFullName = data.inviterName;

  let emailContent = util.replacer(template, data);
  mailer.sendEmail(
    inviteeEmail,
    data.inviterEmail,
    data.inviterName + " wants you to join a VR meeting in Arthur",
    null,
    emailContent
  );
};

InviteCodeSchema.statics.verifyAndgetInviteFullCode = async ({
  shortCode,
  email,
  InviteCode,
  next,
  isLoggingIn = true,
}) => {
  let inviteCode = await InviteCode.findById(shortCode).populate({
    path: "scheduledMeetingId",
    populate: [
      {
        path: "membersInvited",
        match: { userId: { $ne: null } },
        select: "email userId memberType",
        populate: {
          path: "userId",
          model: "User",
          select: "_id email first_name last_name profilePic",
        },
      },
      {
        path: "clientId",
        select: "_id key stackName fleetName",
      },
      {
        path: "roomId",
        select: "_id password environment title",
      },
    ],
  });
  if (!inviteCode) {
    let message = "No meeting or room found";
    next(errorHandler.setCustomError(message, HttpStatus.NOT_FOUND));
    return;
  }
  let { status, scheduledMeetingId, email: savedEmail, isGeneric, _id, fullCode } = inviteCode;
  if (scheduledMeetingId) {
    if (!email) {
      let err = errorHandler.setParamsValidationError(
        { email, shortCode },
        InviteCode.CONSTANTS.PARAMS.EMAIL
      );
      next(err);
      return;
    }
    const foundMember = inviteCode?.scheduledMeetingId?.membersInvited?.find(
      (m) => m?.userId?.email === email || m?.email === email
    );
    if (email !== inviteCode.email || !foundMember) {
      const message = "This email does not match the code";
      next(errorHandler.setCustomError(message, HttpStatus.BAD_REQUEST));
      return;
    }
    const { startDateTime, endDateTime, status } = inviteCode.scheduledMeetingId;
    const startTime = startDateTime.getTime();
    const endTime = endDateTime.getTime();
    const date = new Date();
    const now_utc = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
    const currentTime = new Date(now_utc).getTime();
    const minutesLeft = (startTime - currentTime) / 60000;
    if (
      endTime < currentTime ||
      minutesLeft > 20 ||
      status === ScheduledMeeting.CONSTANTS.STATUSES.CANCELED
    ) {
      let message = "Meeting link has expired or not started yet.";
      next(errorHandler.setCustomError(message, HttpStatus.UNAUTHORIZED));
      return;
    }
  }
  const secondsLeft = inviteCode && util.getSecondsLeft(inviteCode.expireAt);
  if (
    (status === InviteCode.CONSTANTS.STATUSES.VALID &&
      savedEmail === email?.toLowerCase() &&
      !isGeneric &&
      secondsLeft > 0) ||
    (isGeneric && !isLoggingIn)
  ) {
    return {
      shortCode: _id,
      fullCode: fullCode,
      isGeneric,
    };
  }
  if (!isGeneric && secondsLeft <= 0) {
    let message = "No meeting or room found";
    next(errorHandler.setCustomError(message, HttpStatus.BAD_REQUEST));
    return;
  }
  if (status === InviteCode.CONSTANTS.STATUSES.EXPIRED) {
    let message = "Meeting for this invite code has ended";
    next(errorHandler.setCustomError(message, HttpStatus.BAD_REQUEST));
    return;
  }

  let message = "This email does not match the code";
  next(errorHandler.setCustomError(message, HttpStatus.NOT_FOUND));
  return;
};

module.exports = mongoose.model("InviteCode", InviteCodeSchema);
