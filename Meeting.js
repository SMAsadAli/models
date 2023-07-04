// Require Mongoose
var mongoose = require('mongoose');
var moment = require('moment');

// Define a schema
var Schema = mongoose.Schema;

var MeetingSchema = new Schema(
  {
    title: String,
    meetingId: { type: String, ref: 'SavedRoom' },
    status: String,
    description: String,
    organization: String,
    server: String,
    duration: String,
    totalItemsPlaced: Number,
    totalFilesUploaded: Number,
    deviceId: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MeetingUser' }],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDateTime: { type: Date, default: Date.now },
    endDateTime: { type: Date },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: 'meetings' }
);

MeetingSchema.index({
  title: 'text',
  description: 'text',
  organization: 'text',
  status: 'text'
});

MeetingSchema.statics.CONSTANTS = {
  FIELDS: {
    ID: 'id',
    TITLE: 'title',
    STATUS: 'status',
    DESCRIPTION: 'description',
    ORGANIZATION: 'organization',
    SERVER: 'server',
    DURATION: 'duration',
    TOTAL_ITEMS_PLACED: 'totalItemsPlaced',
    TOTAL_FILES_UPLOADED: 'totalFilesUploaded',
    MEMBERS: 'members',
    CREATOR: 'creator',
    DEVICE_ID: 'deviceId'
  },
  PARAMS: {
    TITLE: 'title',
    STATUS: 'status',
    MEETING_ID: 'meetingId',
    DESCRIPTION: 'description',
    ORGANIZATION: 'organization',
    SERVER: 'server',
    CREATOR: 'creator',
    DEVICE_ID: 'deviceId'
  },
  STATUSES: {
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed'
  }
};

MeetingSchema.statics.endMeeting = async (meeting, MeetingUser) => {
  let endDateTime = moment();
  meeting.endDateTime = endDateTime.toString();

  let diff = endDateTime.diff(moment(meeting.startDateTime));
  let duration = moment.duration(diff);
  meeting.duration =
    Math.abs(Math.floor(duration.asHours())).toString() +
    'h ' +
    moment(diff).format('m[m] s[s]');

  let members = await MeetingUser.find({
    meeting: meeting._id,
    state: MeetingUser.CONSTANTS.STATES.IN_MEETING
  });

  for (let member of members) {
    member.timeMeetingLeft = meeting.endDateTime;
    member.state = MeetingUser.CONSTANTS.STATES.LEFT;
    await member.save();
  }
};

MeetingSchema.statics.processMeetingStats = async (Meeting, meeting) => {
  meeting = await Meeting.findById(meeting._id).populate({
    path: 'members',
    populate: {
      path: 'user'
    }
  });

  let totalItemsPlaced = 0;
  let totalFilesUploaded = 0;
  for (let member of meeting.members) {
    totalFilesUploaded += member.filesUploaded;
    totalItemsPlaced += member.itemsPlaced;
  }

  meeting.totalItemsPlaced = totalItemsPlaced;
  meeting.totalFilesUploaded = totalFilesUploaded;
  meeting = await meeting.save();
  return meeting;
};

module.exports = mongoose.model('Meeting', MeetingSchema);
