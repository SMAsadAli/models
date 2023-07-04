// Require Mongoose
var mongoose = require('mongoose');
var moment = require('moment');
const ENV_CONSTANTS = require('../config/envs');
var util = require('../helpers/util');
let mailer = require('../helpers/mailer');
const ical = require('ical-generator');

// Define a schema
var Schema = mongoose.Schema;
var meetingSettingsSchema = new Schema({
  isPrivate: { type: Boolean, default: false },
  membersAllowed: { type: Number },
  meetingDuration: { type: Number },
});

var membersInvitedSchema = new Schema({
  userIdentifier: String,
  meetingVerificationCode: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, default: '' },
  memberType: {
    type: String,
    enum: ['USER', 'GUEST'],
  },
  invitedAt: { type: Date, default: Date.now },
});

var MeetingSchema = new Schema(
  {
    title: String,
    status: {
      type: String,
      enum: ['SCHEDULED', 'CANCELED'],
    },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    membersInvited: [membersInvitedSchema],
    meetingSettings: meetingSettingsSchema,
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDateTime: Date,
    endDateTime: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    roomId: { type: mongoose.Schema.Types.String, ref: 'SavedRoom' },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  },
  { collection: 'scheduled_meetings' }
);

MeetingSchema.statics.CONSTANTS = {
  FIELDS: {
    ID: 'id',
    TITLE: 'title',
    STATUS: 'status',
    CLIENT_ID: 'clientId',
    MEMBERS_INVITED: 'membersInvited',
    CREATOR: 'creator',
    MEETING_SETTINGS: 'meetingSettings',
    START_DATE_TIME: 'startDateTime',
    END_DATE_TIME: 'endDateTime',
  },
  PARAMS: {
    TITLE: 'title',
    STATUS: 'status',
    CLIENT_KEY: 'clientKey',
    ROOM_ID: 'roomId',
    TEAM_ID: 'teamId',
    MEMBERS_INVITED: 'membersInvited',
    MEETING_SETTINGS: 'meetingSettings',
    CREATOR: 'creator',
    START_DATE_TIME: 'startDateTime',
    END_DATE_TIME: 'endDateTime',
  },
  STATUSES: {
    CANCELED: 'CANCELED',
    SCHEDULED: 'SCHEDULED',
  },
  MEMBER_TYPES: {
    USER: 'USER',
    GUEST: 'GUEST',
  },
};

MeetingSchema.statics.sendMeetingInvite = async (
  currentUser,
  userExists,
  inviteeEmail,
  meetingId,
  meetingName,
  startDateTime,
  endDateTime,
  clientKey,
  teamId,
  roomId,
  meetingVerificationCode,
  roomName,
  isMeetingEdited = false
) => {
  let theLink = !!userExists
    ? `${ENV_CONSTANTS.newPortalUrl}rooms/${meetingId}/${clientKey}/${teamId}/${roomId}`
    : `${
        ENV_CONSTANTS.newPortalUrl
      }join?meetingVerificationCode=${meetingVerificationCode}&meetingCode=${meetingId}&startStep=${1}`;

  const templateName = !!userExists
    ? 'register-user-meeting-invite.html'
    : 'uregister-user-meeting-invite.html';
  const templateUrl = `../templates/${templateName}`;
  const template = require(templateUrl);
  const organizerName = currentUser.first_name + ' ' + currentUser.last_name;
  const data = {
    invitationLink: theLink,
    subject: `Meeting invitation to "${meetingName}"`,
    meetingName,
    organizerName,
    meetingDate: moment(startDateTime).format('dddd, MMMM Do YYYY'),
    startTime: moment(startDateTime).format('HH:mm'),
    endTime: moment(endDateTime).format('HH:mm'),
    title: isMeetingEdited ? "Updated Meeting Invitation" : "Meeting Invitation"
  };

  const icsObject = ical({ domain: theLink, name: 'Meeting invite' });
  icsObject.createEvent({
    start: moment(startDateTime),
    end: moment(endDateTime),
    summary: `${data.meetingName}`,
    description: `This is a Virtual Reality meeting scheduled by ${organizerName}.\n\nTo join and for further information visit: \n${theLink}`,
    location: `Arthur | ${roomName}`,
    organizer: {
      name: organizerName,
      email: currentUser.email,
    },
  });

  let icsAttachment = {
    'Content-Type': 'text/calendar',
    method: 'REQUEST',
    content: new Buffer(icsObject.toString()),
    component: 'VEVENT',
    'Content-Class': 'urn:content-classes:calendarmessage',
    name: 'invite.ics',
    filename: 'invite.ics',
  };

  const emailContent = util.replacer(template, data);
  mailer.sendEmail(
    inviteeEmail,
    process.env.EMAIL_USERNAME,
    data.subject,
    null,
    emailContent,
    icsAttachment
  );
};

MeetingSchema.statics.sendMeetingCanceledMail = async (
  currentUser,
  inviteeEmail,
  meetingName,
  startDateTime,
  endDateTime
) => {
  const templateName = 'cancel-user-meeting-invite';
  const templateUrl = `../templates/${templateName}`;
  const template = require(templateUrl);
  const organizerName = currentUser.first_name + ' ' + currentUser.last_name;
  const data = {
    subject: `"${meetingName}" Canceled`,
    meetingName,
    organizerName,
    meetingDate: moment(startDateTime).format('dddd, MMMM Do YYYY'),
    startTime: moment(startDateTime).format('HH:mm'),
    endTime: moment(endDateTime).format('HH:mm'),
  };

  const emailContent = util.replacer(template, data);
  mailer.sendEmail(inviteeEmail, process.env.EMAIL_USERNAME, data.subject, null, emailContent);
};

module.exports = mongoose.model('ScheduledMeeting', MeetingSchema);
